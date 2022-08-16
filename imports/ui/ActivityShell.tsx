import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useFind, useTracker } from 'meteor/react-meteor-data';
import { EntitiesCollection } from '../db/entities';
import { Mongo } from 'meteor/mongo';
import { ActivityEntity, TaskEntity, WorkspaceEntity } from '../api/entities';
import { SessionCatalog } from '../runtime/SessionCatalog';
import { Random } from 'meteor/random';
import { TaskWindow } from './TaskWindow';
import { LauncherWindow } from './LauncherWindow';
import { Runtime } from '../runtime/Runtime';
import { RuntimeContext } from './context';

export const ActivityShell = () => {
  const activities = useFind(() => {
    return EntitiesCollection.find({
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Activity',
    }) as Mongo.Cursor<ActivityEntity>;
  });
  // console.log(activities)

  const [runtime] = useState(() => {
    const catalog = new SessionCatalog();
    const workspaceName = Random.id();
    catalog.insertEntity({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Workspace',
      metadata: {
        name: workspaceName,
      },
      spec: {
        windowOrder: [],
      },
    });
    const workspace = catalog.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', undefined, workspaceName);
    const runtime = new Runtime(catalog, workspace);
    return runtime;
  });
  // const sessionCatalog = useMemo(() => new SessionCatalog(), []);

  // const runtime = useMemo(() => {
  //   const workspace = sessionCatalog.findEntities('runtime.dist.app/v1alpha1', 'Workspace').fetch()[0];
  //   return new Runtime(sessionCatalog, workspace.metadata.name);
  // }, [sessionCatalog]);

  const [didWelcome, setDidWelcome] = useState(false);
  const welcomeAct = activities.find(x => x.metadata.catalogId == 'builtin:welcome');
  useEffect(() => {
    if (!welcomeAct || didWelcome) return;
    runtime.createTask(welcomeAct);
    setDidWelcome(true);
  }, [runtime, welcomeAct]);

  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());

  const tasks = useFind(() => runtime.getTaskList()).slice(0);
  const workspace = useTracker(() => runtime.getWorkspace());

  tasks.sort((a,b) => workspace.spec.windowOrder.indexOf(b.metadata.name) - workspace.spec.windowOrder.indexOf(a.metadata.name));

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
    <RuntimeContext.Provider value={runtime}>
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
          <TaskWindow key={task.metadata.name} task={task} />
        ))}
      </div>
    </RuntimeContext.Provider>
  );
};
