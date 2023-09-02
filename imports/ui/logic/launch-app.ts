import { Random } from "meteor/random";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { CommandEntity, FrameEntity, WorkspaceEntity } from "/imports/entities/runtime";
import { injectTraceAnnotations } from "/imports/lib/tracing";

export async function launchNewIntent(
  runtime: EntityEngine,
  workspaceName: string,
  intent: (CommandEntity['spec'] & {type: 'launch-intent'})['intent'],
  fixedCommandName?: string,
) {
  const commandName = fixedCommandName ?? Random.id();

  await runtime.insertEntity<CommandEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Command',
    metadata: {
      name: commandName,
      namespace: 'session',
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

  await runtime.insertEntity<FrameEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Frame',
    metadata: {
      name: commandName,
      namespace: 'session',
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Workspace',
        name: workspaceName,
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

  await runtime.mutateEntity<WorkspaceEntity>(
    'runtime.dist.app/v1alpha1', 'Workspace',
    'session', workspaceName,
    workspace => {
      workspace.spec.windowOrder.unshift(commandName);
    });
};
