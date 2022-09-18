import React, { DependencyList, Fragment, useContext, useEffect, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

import { RuntimeContext } from './contexts';
import { ShellTopBar } from './ShellTopBar';
import { FrameEntity, WorkspaceEntity } from '../entities/runtime';
import { FrameWindow } from './FrameWindow';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Reset page</button>
  </div>
);

export const ActivityShell = (props: {
  profileId?: string;
  workspaceName: string;
  guest: boolean;
}) => {
  // const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main')
  // if (!shell) throw new Error(`no shell`);

  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());

  // const workspace = runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main');
  // if (!workspace) throw new Error(`no workspace`);

  useBodyClass('shell-workspace-floating');

  const runtime = useContext(RuntimeContext);

  const workspace = useTracker(() => runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName));
  if (!workspace) throw new Error(`no workspace `+props.workspaceName);

  const frames = useTracker(() => runtime.listEntities<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', 'session'));

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
            <FrameWindow frame={task} zIndex={10+workspace.spec.windowOrder.length-workspace.spec.windowOrder.indexOf(task.metadata.name)} workspaceName={props.workspaceName} sessionNamespace={"session"} />
            </ErrorBoundary>
          ))}
      </div>
    </Fragment>
  );
};

function useBodyClass(className: string, deps?: DependencyList) {
  useEffect(() => {
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, deps);
}
