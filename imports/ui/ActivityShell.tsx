import React, { Fragment, useContext, useEffect, useState } from 'react';
import { useFind, useTracker } from 'meteor/react-meteor-data';
import { TaskWindow } from './TaskWindow';
import { LauncherWindow } from './LauncherWindow';
import { RuntimeContext } from './contexts';
import { ActivityEntity } from '../entities/manifest';

export const ActivityShell = () => {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error(`Missing runtime`);

  const [didWelcome, setDidWelcome] = useState(false);
  const welcomeAct = useTracker(() => runtime.manifestCatalog.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', 'welcome', 'main'));
  useEffect(() => {
    if (!welcomeAct || didWelcome) return;
    runtime.createTask(welcomeAct);
    setDidWelcome(true);
  }, [runtime, welcomeAct]);

  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());

  const tasks = useFind(() => runtime.getTaskList());
  const workspace = useTracker(() => runtime.getWorkspace());

  // const taskOrder = tasks.map(x => x.metadata.name).sort((a,b) => workspace.spec.windowOrder.indexOf(b) - workspace.spec.windowOrder.indexOf(a));

  // console.log(workspace.spec.windowOrder)

  // function launchActivityTask(activity: ActivityEntity) {
  //   sessionCatalog.insertEntity({
  //     apiVersion: 'runtime.dist.app/v1alpha1',
  //     kind: 'Task',
  //     metadata: {
  //       name: Random.id(),
  //     },
  //     spec: {
  //       placement: {
  //         type: 'floating',
  //         left: 100 + Math.floor(Math.random() * 200),
  //         top: 100 + Math.floor(Math.random() * 200),
  //         width: activity.spec.windowSizing?.initialWidth ?? 400,
  //         height: activity.spec.windowSizing?.initialHeight ?? 300,
  //       },
  //       stack: [{
  //         activity: {
  //           catalogId: activity.metadata.catalogId,
  //           namespace: activity.metadata.namespace,
  //           name: activity.metadata.name,
  //         },
  //       }],
  //     },
  //   })
  // }

  return (
    <Fragment>
      <section className="shell-powerbar">
        <select defaultValue="dan@danopia.net">
          <optgroup label="Signed in">
            <option>dan@danopia.net</option>
          </optgroup>
          <option disabled>unnamed guest user</option>
          <option disabled>add user...</option>
        </select>
        <select>
          <option>[untitled scratch]</option>
          <optgroup label="change location...">
            <option disabled>local browser storage</option>
            <option disabled>server: dist.app</option>
          </optgroup>
        </select>
        <select>
          <option>floating</option>
          <option disabled>tabbed</option>
          <option disabled>grid</option>
        </select>
        <button onClick={() => setFloatingLayerKey(Math.random())}>Recreate windows</button>
      </section>
      <div className="shell-backdrop" />
      <div className="shell-floating-layer" key={floatingLayerKey}>
        <LauncherWindow />
        {tasks.map(task => (
          <TaskWindow key={task.metadata.name} task={task} zIndex={10+workspace.spec.windowOrder.length-workspace.spec.windowOrder.indexOf(task.metadata.name)} />
        ))}
      </div>
    </Fragment>
  );
};
