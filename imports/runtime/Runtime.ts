import { Random } from "meteor/random";
import { ActivityEntity } from "../entities/manifest";
import { WorkspaceEntity, CommandEntity, TaskEntity } from "../entities/runtime";
import { SessionCatalog } from "./SessionCatalog";

export class Runtime {

  constructor(
    public readonly sessionCatalog: SessionCatalog,
    public readonly workspaceEntity: WorkspaceEntity,
  ) {}

  handleCommand(command: CommandEntity) {
    switch (command.spec.type) {
      case 'launch-intent': {
        if (command.spec.intent.activityRef) {
          const activity = this.sessionCatalog.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', command.metadata.namespace, command.spec.intent.activityRef);
          if (!activity) throw new Error(`activity 404 from intent`);
          this.createTask(activity);
        } else {
          console.log('TODO: Generic intents');
        }
        break;
      }

      case 'bring-to-top': {
        const {taskName} = command.spec;
        this.sessionCatalog.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.workspaceEntity.metadata.namespace, this.workspaceEntity.metadata.name, spaceSNap => spaceSNap.spec.windowOrder.unshift(taskName));
        break;
      }
      case 'move-window': {
        const {xAxis, yAxis} = command.spec;
        this.sessionCatalog.mutateEntity<TaskEntity>('runtime.dist.app/v1alpha1', 'Task', this.workspaceEntity.metadata.namespace, command.spec.taskName, taskSnap => taskSnap.spec.placement.floating = {...taskSnap.spec.placement.floating, left: xAxis, top: yAxis});
        break;
      }
      case 'resize-window': {
        const {xAxis, yAxis} = command.spec;
        this.sessionCatalog.mutateEntity<TaskEntity>('runtime.dist.app/v1alpha1', 'Task', this.workspaceEntity.metadata.namespace, command.spec.taskName, taskSnap => taskSnap.spec.placement.floating = {...taskSnap.spec.placement.floating, width: xAxis, height: yAxis});
        break;
      }

      default: {
        console.log(`TODO: unimpl cmd`, command);
      };
    }
  }

  createTask(firstActivity: ActivityEntity) {
    const taskId = Random.id();

    this.sessionCatalog.insertEntity({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Task',
      metadata: {
        name: taskId,
        ownerReferences: [{
          apiVersion: 'runtime.dist.app/v1alpha1',
          kind: 'Workspace',
          name: this.workspaceEntity.metadata.name,
          uid: this.workspaceEntity.metadata.uid,
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

    this.sessionCatalog.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.workspaceEntity.metadata.namespace, this.workspaceEntity.metadata.name, spaceSNap => spaceSNap.spec.windowOrder.unshift(taskId));
  }

  runTaskCommand(task: TaskEntity, commandSpec: CommandEntity["spec"]) {
    this.handleCommand({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Command',
      metadata: {
        name: 'task-cmd',
        ownerReferences: [{
          apiVersion: 'runtime.dist.app/v1alpha1',
          kind: 'Task',
          name: task.metadata.name,
          uid: task.metadata.uid,
        }],
      },
      spec: commandSpec,
    });
  }

  getWorkspace() {
    return this.sessionCatalog.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', this.workspaceEntity.metadata.namespace, this.workspaceEntity.metadata.name);
  }
  getTaskList() {
    return this.sessionCatalog.findEntities<TaskEntity>('runtime.dist.app/v1alpha1', 'Task');
  }
}
