import { Random } from "meteor/random";
import { ActivityEntity } from "../entities/manifest";
import { WorkspaceEntity, CommandEntity, TaskEntity } from "../entities/runtime";
import { EntityEngine } from "../engine/EntityEngine";

export class ShellSession {

  constructor(
    public readonly runtime: EntityEngine,
    public readonly namespace: string,
    public readonly sessionName: string,
  ) {}
  // public readonly manifestCatalog = new SessionCatalog('system:bundled-apps');

  handleCommand(command: CommandEntity) {
    const taskName = command.metadata.ownerReferences?.find(x => x.kind == 'Task')?.name;

    switch (command.spec.type) {
      case 'launch-intent': {
        console.log('Launching intent', command.spec.intent, 'from', command.metadata);
        if (command.spec.intent.activityRef) {
          const activity = this.runtime.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', command.metadata.namespace, command.spec.intent.activityRef);
          if (!activity) throw new Error(`activity 404 from intent`);
          this.createTask(activity);
        } else {
          console.log('TODO: Generic intents', command.spec.intent);
        }
        break;
      }

      case 'set-task-rollup': {
        if (!taskName) throw new Error('Unknown task name');
        const { state } = command.spec;
        this.runtime.mutateEntity<TaskEntity>('runtime.dist.app/v1alpha1', 'Task', this.namespace, taskName, x => {
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
        this.runtime.deleteEntity<TaskEntity>('runtime.dist.app/v1alpha1', 'Task', this.namespace, taskName);
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
        this.runtime.mutateEntity<TaskEntity>('runtime.dist.app/v1alpha1', 'Task', this.namespace, taskName, taskSnap => {
          taskSnap.spec.placement.floating = {...taskSnap.spec.placement.floating, left: xAxis, top: yAxis};
        });
        break;
      }
      case 'resize-window': {
        if (!taskName) throw new Error('Unknown task name');
        const {xAxis, yAxis} = command.spec;
        this.runtime.mutateEntity<TaskEntity>('runtime.dist.app/v1alpha1', 'Task', this.namespace, taskName, taskSnap => {
          taskSnap.spec.placement.floating = {...taskSnap.spec.placement.floating, width: xAxis, height: yAxis};
        });
        break;
      }

      default: {
        console.log(`TODO: unimpl cmd`, command);
      };
    }
  }

  createTask(firstActivity: ActivityEntity) {
    const taskId = Random.id();

    this.runtime.insertEntity({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Task',
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
        stack: [{
          activity: {
            catalogId: firstActivity.metadata.catalogId,
            namespace: firstActivity.metadata.namespace,
            name: firstActivity.metadata.name,
          },
        }],
      },
    });

    this.runtime.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.namespace, this.sessionName, spaceSNap => {spaceSNap.spec.windowOrder.unshift(taskId)});
  }

  runTaskCommand(task: TaskEntity, activity: ActivityEntity | null, commandSpec: CommandEntity["spec"]) {
    this.handleCommand({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Command',
      metadata: {
        name: 'task-cmd',
        namespace: activity?.metadata.namespace,
        ownerReferences: [{
          apiVersion: 'runtime.dist.app/v1alpha1',
          kind: 'Task',
          name: task.metadata.name,
          uid: task.metadata.uid,
        }, ...(activity ? [{
          apiVersion: 'runtime.dist.app/v1alpha1',
          kind: 'Activity',
          name: activity.metadata.name,
          uid: activity.metadata.uid,
        }] : [])],
      },
      spec: commandSpec,
    });
  }

  getWorkspace() {
    const ent = this.runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.namespace, this.sessionName);
    if (!ent) throw new Error(`no workspace`);
    return ent;
  }
  getTaskList() {
    return this.runtime.listEntities<TaskEntity>('runtime.dist.app/v1alpha1', 'Task');
  }
}