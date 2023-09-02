import { Random } from "meteor/random";
import { EntityHandle } from "../engine/EntityHandle";
import { CommandEntity, FrameEntity, WorkspaceEntity } from "../entities/runtime";
import { injectTraceAnnotations } from "../lib/tracing";

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
