import React, { Fragment, useContext, useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { TaskWindow } from './TaskWindow';
import { LauncherWindow } from './LauncherWindow';
import { RuntimeContext } from './contexts';
import { ShellTopBar } from './ShellTopBar';
import { CommandEntity } from '../entities/runtime';
import { IntentWindow } from './IntentWindow';

export const ActivityShell = () => {
  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'default', 'main')
  if (!shell) throw new Error(`no shell`);

  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());

  const tasks = useTracker(() => shell.getTaskList());
  const workspace = useTracker(() => shell.getWorkspace());

  const intentCommands = useTracker(() => runtime.listEntities<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'default')).flatMap(x => x.spec.type == 'launch-intent' ? [{metadata: x.metadata, spec: x.spec.intent}] : []);

  return (
    <Fragment>
      <ShellTopBar>
        <button onClick={() => setFloatingLayerKey(Math.random())}>Recreate windows</button>
      </ShellTopBar>
      <div className="shell-backdrop" />
      <div className="shell-floating-layer" key={floatingLayerKey}>
        <LauncherWindow />
        {tasks.map(task => (
          <TaskWindow key={task.metadata.name} task={task} zIndex={10+workspace.spec.windowOrder.length-workspace.spec.windowOrder.indexOf(task.metadata.name)} />
        ))}
        {intentCommands.map(cmd => (
          <IntentWindow key={cmd.metadata.name} intent={cmd.spec} cmdName={cmd.metadata.name} />
        ))}
      </div>
    </Fragment>
  );
};
