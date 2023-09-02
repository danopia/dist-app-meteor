import { Random } from "meteor/random";
import { EntityHandle } from "../engine/EntityHandle";
import { ActivityTaskEntity, CommandEntity, FrameEntity, WorkspaceEntity } from "../entities/runtime";
import { asyncSpan, injectTraceAnnotations, syncSpan } from "../lib/tracing";
import { Tracker } from "meteor/tracker";
import { Meteor } from "meteor/meteor";
import { ActivityEntity } from "../entities/manifest";
import { AppInstallationEntity } from "../entities/profile";

export async function bringToTop(
  hWorkspace: EntityHandle<WorkspaceEntity>,
  taskName: string,
) {
  await hWorkspace.mutate(spaceSnap => {
    if (spaceSnap.spec.windowOrder[0] == taskName) return Symbol.for('no-op');
    spaceSnap.spec.windowOrder = [
      taskName,
      ...spaceSnap.spec.windowOrder.filter(x => x !== taskName),
    ];
  });
}

export async function deleteFrame(
  hWorkspace: EntityHandle<WorkspaceEntity>,
  taskName: string,
) {

  // TODO: garbage-collect whatever contentRef points to (maybe ownerReferences helps)
  hWorkspace.getNeighborHandle<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', taskName).delete();

  hWorkspace.mutate(spaceSnap => {
    spaceSnap.spec.windowOrder = spaceSnap.spec.windowOrder.filter(x => x != taskName);
  });
}

export async function launchNewIntent(
  hWorkspace: EntityHandle<WorkspaceEntity>,
  intent: (CommandEntity['spec'] & {type: 'launch-intent'})['intent'],
  fixedCommandName?: string,
) {
  const commandName = fixedCommandName ?? Random.id();

  await hWorkspace.insertNeighbor<CommandEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Command',
    metadata: {
      name: commandName,
      annotations: injectTraceAnnotations(),
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Frame',
        name: commandName,
      }],
    },
    spec: {
      type: 'launch-intent',
      intent,
    },
  });

  await hWorkspace.insertNeighbor<FrameEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Frame',
    metadata: {
      name: commandName,
      title: 'via launchNewIntent()',
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Workspace',
        name: hWorkspace.coords.name,
      }],
    },
    spec: {
      contentRef: '../Command/'+commandName,
      placement: {
        current: 'floating',
        grid: {
          area: 'fullscreen',
        },
        floating: {
          left: 200,
          top: 200,
        },
        rolledWindow: false,
      },
    },
  });

  await bringToTop(hWorkspace, commandName);
};

export async function runTaskCommandForResult(
  hWorkspace: EntityHandle<WorkspaceEntity>,
  task: FrameEntity,
  activityTask: ActivityTaskEntity | null,
  commandSpec: CommandEntity["spec"],
) {
  return await asyncSpan(`ShellSession task: ${commandSpec.type}`, {}, async () => {
    const commandName = crypto.randomUUID().split('-')[0];

    const command: CommandEntity = {
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Command',
      metadata: {
        name: commandName,
        namespace: task.metadata.namespace,
        annotations: injectTraceAnnotations(),
        ownerReferences: [
          ...task.metadata.ownerReferences ?? [],
          {
            apiVersion: 'runtime.dist.app/v1alpha1',
            kind: 'Frame',
            name: task.metadata.name,
            uid: task.metadata.uid,
          },
          ...(activityTask ? [{
            apiVersion: 'runtime.dist.app/v1alpha1',
            kind: 'ActivityTask',
            name: activityTask.metadata.name,
            uid: activityTask.metadata.uid,
          }] : []),
        ],
      },
      spec: commandSpec,
    }

    // TODO: insertNeighbor should have sibling methods or similar to fill ownerReferences

    const hCommand = await hWorkspace.insertNeighbor(command);

    await hWorkspace.insertNeighbor<FrameEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Frame',
      metadata: {
        title: commandSpec.type == 'launch-intent'
          ? commandSpec.intent.action?.split('.').slice(-1)[0]
          : commandSpec.type,
        name: commandName,
        ownerReferences: [
          ...command.metadata.ownerReferences?.filter(x => x.kind == 'Workspace') ?? [],
          {
            apiVersion: command.apiVersion,
            kind: command.kind,
            name: command.metadata.name,
          },
        ],
      },
      spec: {
        contentRef: '../Command/'+commandName,
        sizeConstraint: {
          maxWidth: 600, // TODO
        },
        placement: {
          current: 'floating',
          grid: {
            area: 'fullscreen',
          },
          floating: {
            left: 200,
            top: 200,
          },
          rolledWindow: false,
        },
      },
    });
    await bringToTop(hWorkspace, commandName);

    let computation: Tracker.Computation | null = null;
    return await new Promise<CommandEntity>((ok, fail) => {
      computation = Tracker.autorun(() => {
        hWorkspace.get
        const cmd = hCommand.get();
        if (!cmd?.status) return;
        switch (cmd.status.outcome) {
          case 'Completed':
            ok(cmd);
            break;
          case 'Failed':
            fail(`Failed: ${cmd.status.message ?? 'no message given'}`);
            break;
          case 'Denied':
            fail(`Denied: ${cmd.status.message ?? 'no message given'}`);
            break;
        }
      });
    }).finally(() => computation?.stop());
  });
}

export function handleCommand(hWorkspace: EntityHandle<WorkspaceEntity>, command: CommandEntity) {
  const owningFrameRef = command.metadata.ownerReferences?.find(x => x.kind == 'Frame');
  if (!owningFrameRef) throw new Meteor.Error(`bug`, `No owning "Frame" found on given Command`);

  const hFrame =/* owningFrameRef
    ?*/ hWorkspace.getNeighborHandle<FrameEntity>(
        'runtime.dist.app/v1alpha1', 'Frame',
        owningFrameRef.name)
    // : null;

  switch (command.spec.type) {
    // case 'launch-intent': {
    //   console.log('Launching intent', command.spec.intent, 'from', command.metadata);
    //   // if (command.spec.intent.activity?.name) {
    //   //   const activity = this.runtime.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', command.metadata.namespace, command.spec.intent.activity.name);
    //   //   if (!activity) throw new Error(`activity 404 from intent`);
    //   //   this.createTask(activity);
    //   // } else {
    //   //   console.log('TODO: Generic intents', command.spec.intent);

    //   // this is offloaded to the async queue
    //   // it's processed elsewhere
    //   hWorkspace.insertNeighbor({...command, metadata: {name: Random.id(), namespace: this.namespace}});
    //   // }
    //   break;
    // }

    case 'set-task-rollup': {
      // if (!taskName) throw new Error('Unknown task name');
      const { state } = command.spec;
      hFrame
        .mutate(x => {
          switch (state) {
            case 'normal': x.spec.placement.rolledWindow = false; break;
            case 'rolled': x.spec.placement.rolledWindow = true; break;
            case 'toggle': x.spec.placement.rolledWindow = !x.spec.placement.rolledWindow; break;
          }
        });
      bringToTop(hWorkspace, hFrame.coords.name);
      break;
    }

    case 'delete-task': {
      // if (!taskName) throw new Error('Unknown task name');
      deleteFrame(hWorkspace, hFrame.coords.name);
      break;
    }

    case 'bring-to-top': {
      // if (!taskName) throw new Error('Unknown task name');
      bringToTop(hWorkspace, hFrame.coords.name);
      break;
    }

    case 'move-window': {
      // if (!taskName) throw new Error('Unknown task name');
      const {xAxis, yAxis} = command.spec;
      hFrame.mutate(taskSnap => {
        taskSnap.spec.placement.floating = {...taskSnap.spec.placement.floating, left: xAxis, top: yAxis};
      });
      break;
    }
    case 'resize-window': {
      // if (!taskName) throw new Error('Unknown task name');
      const {xAxis, yAxis} = command.spec;
      hFrame.mutate(taskSnap => {
        taskSnap.spec.placement.floating = {...taskSnap.spec.placement.floating, width: xAxis, height: yAxis};
      });
      break;
    }

    default: {
      // console.log(`TODO: unimpl cmd`, command);

      // anything else gets offloaded to the async queue
      // e.g. intent launches or unknown commands
      // it's processed (properly, or as an error report) elsewhere async
      const commandName = Random.id();
      hFrame.insertNeighbor<CommandEntity>({
        ...command,
        metadata: {
          ...command.metadata,
          name: commandName,
        },
      });

      hFrame.insertNeighbor<FrameEntity>({
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Frame',
        metadata: {
          title: `Launch Intent`,
          name: commandName,
          ownerReferences: command.metadata.ownerReferences?.filter(x => x.kind == 'Workspace'),
        },
        spec: {
          contentRef: '../Command/'+commandName,
          sizeConstraint: {
            maxWidth: 600, // TODO
          },
          placement: {
            current: 'floating',
            grid: {
              area: 'fullscreen',
            },
            floating: {
              left: 200,
              top: 200,
            },
            rolledWindow: false,
          },
        },
      });

      bringToTop(hWorkspace, commandName);
    };
  }
}

export function createTask(hWorkspace: EntityHandle<WorkspaceEntity>, firstActivity: ActivityEntity, appInstallation: AppInstallationEntity) {
  const taskId = Random.id();
  const actInstId = Random.id();

  hWorkspace.insertNeighbor<ActivityTaskEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'ActivityTask',
    metadata: {
      name: actInstId,
      // TODO: if this namespace is left off, this goes into default? why does it work
      // namespace: this.namespace,
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Frame',
        name: taskId,
      }],
    },
    spec: {
      installationNamespace: appInstallation.metadata.namespace ?? 'bug-15612',
      installationName: appInstallation.metadata.name,
      activityName: firstActivity.metadata.name,
      // activity: {
      //   catalogId: firstActivity.metadata.catalogId,
      //   namespace: firstActivity.metadata.namespace,
      //   name: firstActivity.metadata.name,
      // },
    },
    state: {
      appData: {},
    },
  });

  hWorkspace.insertNeighbor<FrameEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Frame',
    metadata: {
      title: firstActivity.metadata.title,
      name: taskId,
      // TODO: if this namespace is left off, this goes into default? why does it work
      // namespace: this.namespace,
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Workspace',
        name: hWorkspace.coords.name,
        // uid: this.workspaceEntity.metadata.uid,
      }],
    },
    spec: {
      placement: {
        current: 'floating',
        rolledWindow: false,
        floating: {
          left: 100 + Math.floor(Math.random() * 200),
          top: 100 + Math.floor(Math.random() * 200),
          width: firstActivity.spec.windowSizing?.initialWidth ?? 400,
          height: firstActivity.spec.windowSizing?.initialHeight ?? 300,
        },
        grid: {
          area: 'fullscreen',
        },
      },
      contentRef: `../ActivityTask/${actInstId}`,
    },
  });

  bringToTop(hWorkspace, taskId);
}

export function runTaskCommand(
  hWorkspace: EntityHandle<WorkspaceEntity>,
  task: FrameEntity,
  activityTask: ActivityTaskEntity | null,
  commandSpec: CommandEntity["spec"],
) {
  syncSpan(`ShellSession task: ${commandSpec.type}`, {}, () => {
    handleCommand(hWorkspace, {
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Command',
      metadata: {
        name: 'task-cmd',
        namespace: task.metadata.namespace,
        annotations: injectTraceAnnotations(),
        ownerReferences: [
          ...task.metadata.ownerReferences ?? [],
          {
            apiVersion: 'runtime.dist.app/v1alpha1',
            kind: 'Frame',
            name: task.metadata.name,
            uid: task.metadata.uid,
          },
          ...(activityTask ? [{
            apiVersion: 'runtime.dist.app/v1alpha1',
            kind: 'ActivityTask',
            name: activityTask.metadata.name,
            uid: activityTask.metadata.uid,
          }] : []),
        ],
      },
      spec: commandSpec,
    });
  });
}
