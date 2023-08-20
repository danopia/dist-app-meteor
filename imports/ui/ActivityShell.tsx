import React, { useContext, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { ErrorBoundary } from 'react-error-boundary';

import { RuntimeContext } from './contexts';
// import { ShellTopBar } from './ShellTopBar';
import { FrameEntity, WorkspaceEntity } from '../entities/runtime';
import { FrameContainer } from './FrameContainer';
import { ErrorFallback } from '../lib/error-fallback';
import { useBodyClass } from '../lib/use-body-class';
import { MyCommandPalette } from './CommandPalette';

export const ActivityShell = (props: {
  savedSessionName?: string;
  workspaceName?: string;
  guest: boolean;
}) => {
  // Layer key intended solely to make for easy UI recreations
  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());
  const workspaceName = props.workspaceName ?? "main";

  const runtime = useContext(RuntimeContext);

  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', workspaceName)

  const workspace = useTracker(() => runtime
    .getEntity<WorkspaceEntity>(
      'runtime.dist.app/v1alpha1', 'Workspace',
      'session', workspaceName,
    ), [runtime, workspaceName]);
  const frames = useTracker(() => runtime
    .listEntities<FrameEntity>(
      'runtime.dist.app/v1alpha1', 'Frame',
      'session',
    )
    .filter(x => x.metadata.ownerReferences?.some(y => y.name == workspaceName))
  , [runtime, workspaceName]);
  // TODO: also list debug event entities and indicate them on their frames

  // useBodyClass('shell-workspace-floating');

  if (!workspace) {
    return (
      <div>BUG: no workspace {workspaceName}</div>
    );
  }
  if (!shell) {
    return (
      <div>BUG: no shell ${props.workspaceName}</div>
    );
  }

  const frameMode = workspace.spec.frameMode ?? 'windowing';

  // const order = workspace.spec.windowOrder;
  // const orderedFrames = frames.slice(0).sort((a,b) => {
  //   return order.indexOf(b.metadata.name) - order.indexOf(a.metadata.name);
  // })

  // console.log({old:  workspace,  prop: props.savedSessionName})

  // TODO: pass entity handles and APIs down, to parameterize namespace
  return (
    <>
      <section className="shell-powerbar">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <MyCommandPalette parentElement=".activity-shell-parent" workspaceName={workspaceName} />
        </ErrorBoundary>
        <select onChange={(evt) => runtime.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', workspace.metadata.namespace, workspace.metadata.name, x => {
            x.spec.frameMode = evt.currentTarget.value as 'windowing' | 'tabbed';
          })} defaultValue={frameMode}>
          <option value="windowing">windowing</option>
          <option value="tabbed">tabbed</option>
        </select>
        <button onClick={() => setFloatingLayerKey(Math.random())}>Recreate windows</button>
        <div style={{flex: 1}}></div>
      </section>
      {frameMode == 'windowing' ? (
        <div className="shell-backdrop" />
      ) : []}
      {props.savedSessionName == workspace.spec.savedSessionName ? (
        <div className={frameMode == 'tabbed' ? 'shell-grid-layer' : 'shell-floating-layer'} key={floatingLayerKey}>
          {frameMode == 'tabbed' ? (
            <div className="shell-tabs">
              <h4>Moin Moin</h4>
              {frames.map(frame => (
                <div className="one-tab" key={frame.metadata.name}>
                  <button className="main" type="button" onClick={() => {
                    shell.runTaskCommand(frame, null, {
                      type: 'bring-to-top',
                    });
                  }}>{frame.metadata?.title ?? frame.metadata.name}</button>
                  <button className="action" type="button" onClick={() => {
                    shell.runTaskCommand(frame, null, {
                      type: 'delete-task',
                    });
                  }}>x</button>
                </div>
              ))}
            </div>
          ) : []}
          {frames.map(task => (
            <ErrorBoundary key={task.metadata.name} FallbackComponent={ErrorFallback}>
              <FrameContainer
                  frame={task}
                  zIndex={10+workspace.spec.windowOrder.length-workspace.spec.windowOrder.indexOf(task.metadata.name)}
                  className={workspace.spec.windowOrder.indexOf(task.metadata.name) == 0 ? 'topmost' : null} workspaceName={workspaceName}
                  sessionNamespace={"session"}
                  frameMode={frameMode}
                />
            </ErrorBoundary>
          ))}
        </div>
      ) : (
        <div>Restoring session...</div>
      )}
    </>
  );
};
