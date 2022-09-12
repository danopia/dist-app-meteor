import React, { DependencyList, Fragment, useContext, useEffect, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { TaskWindow } from './TaskWindow';
import { LauncherWindow } from './LauncherWindow';
import { RuntimeContext } from './contexts';
import { ShellTopBar } from './ShellTopBar';
import { CommandEntity, TaskEntity, WorkspaceEntity } from '../entities/runtime';
import { IntentWindow } from './IntentWindow';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Reset page</button>
  </div>
);

export const ActivityShell = () => {
  // const runtime = useContext(RuntimeContext);
  // const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main')
  // if (!shell) throw new Error(`no shell`);

  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());

  // const workspace = runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main');
  // if (!workspace) throw new Error(`no workspace`);

  useBodyClass('shell-workspace-floating');

  return (
    <Fragment>
      <ShellTopBar>
        <button onClick={() => setFloatingLayerKey(Math.random())}>Recreate windows</button>
      </ShellTopBar>
      <div className="shell-backdrop" />
      <div className="shell-floating-layer" key={floatingLayerKey}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <LauncherWindow />
        </ErrorBoundary>
        <ShellTasks />
        <ShellCommands />
      </div>
    </Fragment>
  );
};

export const ShellTasks = () => {
  const runtime = useContext(RuntimeContext);

  const workspace = runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main');
  if (!workspace) throw new Error(`no workspace`);

  const tasks = useTracker(() => runtime.listEntities<TaskEntity>('runtime.dist.app/v1alpha1', 'Task', 'session'));

  return (
    <Fragment>
      {tasks.map(task => (
        <ErrorBoundary key={task.metadata.name} FallbackComponent={ErrorFallback}>
          <TaskWindow task={task} zIndex={10+workspace.spec.windowOrder.length-workspace.spec.windowOrder.indexOf(task.metadata.name)} />
        </ErrorBoundary>
      ))}
    </Fragment>
  );
};

export const ShellCommands = () => {
  const runtime = useContext(RuntimeContext);

  const intentCommands = useTracker(() => runtime.listEntities<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session'));//.flatMap(x => x.spec.type == 'launch-intent' ? [{metadata: x.metadata, spec: x.spec.intent}] : []);

  return (
    <Fragment>
      {intentCommands.map(cmd => (
        <ErrorBoundary key={cmd.metadata.name} FallbackComponent={ErrorFallback}>
          <IntentWindow command={cmd} />
        </ErrorBoundary>
      ))}
    </Fragment>
  );

            // apiVersion: 'runtime.dist.app/v1alpha1',
            // kind: 'Command',
            // metadata: cmd.metadata,
            // spec: {
            //   type: 'launch-intent',
            //   intent: cmd.spec,
            // },
          // })} />
        };

function useBodyClass(className: string, deps?: DependencyList) {
  useEffect(() => {
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, deps);
}
