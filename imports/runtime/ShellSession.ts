import { Random } from "meteor/random";
import { ActivityEntity } from "../entities/manifest";
import { WorkspaceEntity, CommandEntity, FrameEntity, ActivityTaskEntity } from "../entities/runtime";
import { EntityEngine } from "../engine/EntityEngine";
import { AppInstallationEntity } from "../entities/profile";

export class ShellSession {

  constructor(
    public readonly runtime: EntityEngine,
    public readonly namespace: string,
    public readonly sessionName: string,
  ) {}
  // public readonly manifestCatalog = new SessionCatalog('system:bundled-apps');

  handleCommand(command: CommandEntity) {
    const taskName = command.metadata.ownerReferences?.find(x => x.kind == 'Frame')?.name;

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
      //   this.runtime.insertEntity({...command, metadata: {name: Random.id(), namespace: this.namespace}});
      //   // }
      //   break;
      // }

      case 'set-task-rollup': {
        if (!taskName) throw new Error('Unknown task name');
        const { state } = command.spec;
        this.runtime.mutateEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', this.namespace, taskName, x => {
          switch (state) {
            case 'normal': x.spec.placement.rolledWindow = false; break;
            case 'rolled': x.spec.placement.rolledWindow = true; break;
            case 'toggle': x.spec.placement.rolledWindow = !x.spec.placement.rolledWindow; break;
          }
        });
        this.runtime.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.namespace, this.sessionName, spaceSnap => {
          if (spaceSnap.spec.windowOrder[0] == taskName) return Symbol.for('no-op');
          spaceSnap.spec.windowOrder.unshift(taskName);
        });
        break;
      }

      case 'delete-task': {
        if (!taskName) throw new Error('Unknown task name');
        // TODO: garbage-collect whatever contentRef points to (maybe ownerReferences helps)
        this.runtime.deleteEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', this.namespace, taskName);
        this.runtime.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.namespace, this.sessionName, spaceSnap => {
          if (spaceSnap.spec.windowOrder[0] == taskName) return Symbol.for('no-op');
          spaceSnap.spec.windowOrder.unshift(taskName);
        });
        break;
      }

      case 'bring-to-top': {
        if (!taskName) throw new Error('Unknown task name');
        this.runtime.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.namespace, this.sessionName, spaceSnap => {
          if (spaceSnap.spec.windowOrder[0] == taskName) return Symbol.for('no-op');
          spaceSnap.spec.windowOrder.unshift(taskName);
        });
        break;
      }
      case 'move-window': {
        if (!taskName) throw new Error('Unknown task name');
        const {xAxis, yAxis} = command.spec;
        this.runtime.mutateEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', this.namespace, taskName, taskSnap => {
          taskSnap.spec.placement.floating = {...taskSnap.spec.placement.floating, left: xAxis, top: yAxis};
        });
        break;
      }
      case 'resize-window': {
        if (!taskName) throw new Error('Unknown task name');
        const {xAxis, yAxis} = command.spec;
        this.runtime.mutateEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', this.namespace, taskName, taskSnap => {
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
        this.runtime.insertEntity<CommandEntity>({
          ...command,
          metadata: {
            ...command.metadata,
            name: commandName,
            namespace: this.namespace,
          },
        });

        this.runtime.insertEntity<FrameEntity>({
          apiVersion: 'runtime.dist.app/v1alpha1',
          kind: 'Frame',
          metadata: {
            name: commandName,
            namespace: this.namespace,
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
      };
    }
  }

  createTask(firstActivity: ActivityEntity, appInstallation: AppInstallationEntity) {
    const taskId = Random.id();
    const actInstId = Random.id();

    this.runtime.insertEntity<ActivityTaskEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'ActivityTask',
      metadata: {
        name: actInstId,
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

    this.runtime.insertEntity<FrameEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Frame',
      metadata: {
        name: taskId,
        ownerReferences: [{
          apiVersion: 'runtime.dist.app/v1alpha1',
          kind: 'Workspace',
          name: this.sessionName,
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

    this.runtime.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.namespace, this.sessionName, spaceSNap => {spaceSNap.spec.windowOrder.unshift(taskId)});
  }

  runTaskCommand(task: FrameEntity, activityTask: ActivityTaskEntity | null, commandSpec: CommandEntity["spec"]) {
    this.handleCommand({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Command',
      metadata: {
        name: 'task-cmd',
        namespace: task.metadata.namespace,
        ownerReferences: [{
          apiVersion: 'runtime.dist.app/v1alpha1',
          kind: 'Frame',
          name: task.metadata.name,
          uid: task.metadata.uid,
        }, ...(activityTask ? [{
          apiVersion: 'runtime.dist.app/v1alpha1',
          kind: 'ActivityTask',
          name: activityTask.metadata.name,
          uid: activityTask.metadata.uid,
        }] : [])],
      },
      spec: commandSpec,
    });
  }

  // getWorkspace() {
  //   const ent = this.runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.namespace, this.sessionName);
  //   if (!ent) throw new Error(`no workspace`);
  //   return ent;
  // }
  // getTaskList() {
  //   return this.runtime.listEntities<TaskEntity>('runtime.dist.app/v1alpha1', 'Frame', this.namespace);
  // }
}
