import React, { Fragment, useEffect, useState } from 'react';
import { useFind } from 'meteor/react-meteor-data';
import { EntitiesCollection } from '../db/entities';
import { Mongo } from 'meteor/mongo';
import { ActivityEntity, TaskEntity } from '../api/entities';
import { SessionCatalog } from '../runtime/SessionCatalog';
import { Random } from 'meteor/random';
import { TaskWindow } from './TaskWindow';
import { LauncherWindow } from './LauncherWindow';

export const ActivityShell = () => {
  const activities = useFind(() => {
    return EntitiesCollection.find({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Activity',
    }) as Mongo.Cursor<ActivityEntity>;
  });
  // console.log(activities)

  const [sessionCatalog] = useState(new SessionCatalog());
  // const sessionCatalog = useMemo(() => new SessionCatalog(), []);

  const [didWelcome, setDidWelcome] = useState(false);
  const welcomeAct = activities.find(x => x.metadata.catalogId == 'builtin:welcome');
  useEffect(() => {
    if (!welcomeAct || didWelcome) return;
    launchActivityTask(welcomeAct);
    setDidWelcome(true);
  }, [sessionCatalog, welcomeAct]);

  const [floatingLayerKey, setFloatingLayerKey] = useState(Math.random());

  const tasks = useFind(() => sessionCatalog
    .findEntities<TaskEntity>('dist.app/v1alpha1', 'Task'));

  function launchActivityTask(activity: ActivityEntity) {
    sessionCatalog.insertEntity({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Task',
      metadata: {
        name: Random.id(),
      },
      spec: {
        placement: {
          type: 'floating',
          left: 100 + Math.floor(Math.random() * 200),
          top: 100 + Math.floor(Math.random() * 200),
          width: activity.spec.windowSizing?.initialWidth ?? 400,
          height: activity.spec.windowSizing?.initialHeight ?? 300,
        },
        stack: [{
          activity: {
            catalogId: activity.metadata.catalogId,
            namespace: activity.metadata.namespace,
            name: activity.metadata.name,
          },
        }],
      },
    })
  }

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
        <LauncherWindow sessionCatalog={sessionCatalog} />
        {tasks.map(task => (
          <TaskWindow key={task._id} task={task} sessionCatalog={sessionCatalog} />
        ))}
      </div>
    </Fragment>
  );
};
