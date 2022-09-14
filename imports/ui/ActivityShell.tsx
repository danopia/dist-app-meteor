import React, { DependencyList, Fragment, useContext, useEffect, useMemo, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { TaskWindow } from './TaskWindow';
import { LauncherWindow } from './LauncherWindow';
import { RuntimeContext } from './contexts';
import { ShellTopBar } from './ShellTopBar';
import { CommandEntity, TaskEntity, WorkspaceEntity } from '../entities/runtime';
import { IntentWindow } from './IntentWindow';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { insertGuestTemplate } from '../engine/EngineFactory';
import { Random } from 'meteor/random';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Reset page</button>
  </div>
);

export const ActivityShell = (props: {
  profileId?: string;
  workspaceName?: string;
  guest: boolean;
}) => {
  const runtime = useContext(RuntimeContext);
  // const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main')
  // if (!shell) throw new Error(`no shell`);

  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());

  // const workspace = runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main');
  // if (!workspace) throw new Error(`no workspace`);

  useBodyClass('shell-workspace-floating');

  const workspaceName = useMemo(() => {
    if (runtime.namespaces.has('profile')) {
      runtime.namespaces.delete('profile');
    }
    if (props.guest) {
      console.log('add profile: guest');
      runtime.addNamespace({
        name: 'profile',
        spec: {
          layers: [{
            mode: 'ReadWrite',
            accept: [{
              apiGroup: 'profile.dist.app',
            }],
            storage: {
              type: 'local-inmemory',
            },
          }],
        }});
      const workspaceName = Random.id();
      insertGuestTemplate(runtime, workspaceName);
      return workspaceName;
    } else if (props.profileId && props.workspaceName) {
      console.log('add profile: user');
      runtime.addNamespace({
        name: 'profile',
        spec: {
          layers: [{
            mode: 'ReadWrite',
            accept: [{
              apiGroup: 'profile.dist.app',
            }],
            storage: {
              type: 'profile',
              profileId: props.profileId,
            },
          }],
        }});
      const workspaceName = Random.id();
      runtime.insertEntity<WorkspaceEntity>({
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Workspace',
        metadata: {
          name: workspaceName,
          namespace: 'session',
        },
        spec: {
          windowOrder: [],
        },
      });
      return workspaceName;
    } else throw new Error(`Called without props`);
  }, [runtime]);

  // TODO: pass entity handles and APIs down, to parameterize namespace

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
        <ShellTasks workspaceName={workspaceName} />
        <ShellCommands workspaceName={workspaceName} />
      </div>
    </Fragment>
  );
};

export const ShellTasks = (props: {
  workspaceName: string;
}) => {
  const runtime = useContext(RuntimeContext);

  const workspace = runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName);
  if (!workspace) throw new Error(`no workspace `+props.workspaceName);

  const tasks = useTracker(() => runtime.listEntities<TaskEntity>('runtime.dist.app/v1alpha1', 'Task', 'session'));

  return (
    <Fragment>
      {tasks.map(task => (
        <ErrorBoundary key={task.metadata.name} FallbackComponent={ErrorFallback}>
          <TaskWindow task={task} zIndex={10+workspace.spec.windowOrder.length-workspace.spec.windowOrder.indexOf(task.metadata.name)} workspaceName={props.workspaceName} />
        </ErrorBoundary>
      ))}
    </Fragment>
  );
};

export const ShellCommands = (props: {
  workspaceName: string;
}) => {
  const runtime = useContext(RuntimeContext);

  const intentCommands = useTracker(() => runtime.listEntities<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session'));//.flatMap(x => x.spec.type == 'launch-intent' ? [{metadata: x.metadata, spec: x.spec.intent}] : []);

  return (
    <Fragment>
      {intentCommands.map(cmd => (
        <ErrorBoundary key={cmd.metadata.name} FallbackComponent={ErrorFallback}>
          <IntentWindow command={cmd} workspaceName={props.workspaceName} />
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
