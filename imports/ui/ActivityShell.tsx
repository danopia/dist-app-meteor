import React, { Fragment, useContext, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { ErrorBoundary } from 'react-error-boundary';

import { RuntimeContext } from './contexts';
import { ShellTopBar } from './ShellTopBar';
import { FrameEntity, WorkspaceEntity } from '../entities/runtime';
import { FrameContainer } from './FrameContainer';
import { ErrorFallback } from '../lib/error-fallback';
import { useBodyClass } from '../lib/use-body-class';

export const ActivityShell = (props: {
  profileId?: string;
  workspaceName: string;
  guest: boolean;
}) => {
  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());

  const runtime = useContext(RuntimeContext);
  const workspace = useTracker(() => runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName), [runtime, props.workspaceName]);
  const frames = useTracker(() => runtime.listEntities<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', 'session'), [runtime]);

  if (!workspace) throw new Error(`no workspace `+props.workspaceName);
  useBodyClass('shell-workspace-floating');

  // TODO: pass entity handles and APIs down, to parameterize namespace
  return (
    <Fragment>
      <ShellTopBar>
        <button onClick={() => setFloatingLayerKey(Math.random())}>Recreate windows</button>
      </ShellTopBar>
      <div className="shell-backdrop" />
      <div className="shell-floating-layer" key={floatingLayerKey}>
        {frames.map(task => (
          <ErrorBoundary key={task.metadata.name} FallbackComponent={ErrorFallback}>
            <FrameContainer frame={task} zIndex={10+workspace.spec.windowOrder.length-workspace.spec.windowOrder.indexOf(task.metadata.name)} workspaceName={props.workspaceName} sessionNamespace={"session"} />
          </ErrorBoundary>
        ))}
      </div>
    </Fragment>
  );
};
