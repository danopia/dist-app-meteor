import React, { Fragment, useMemo, useState } from 'react';
import { useFind, useTracker } from 'meteor/react-meteor-data';
import { EntitiesCollection } from '../db/entities';
import { Mongo } from 'meteor/mongo';
import { ActivityEntity, Entity, IframeImplementationSpec, ImplementationSpec, TaskEntity } from '../api/entities';
import { html } from 'common-tags';
import { ActivityEmbed } from './ActivityEmbed';
import { SessionCatalog } from '../runtime/SessionCatalog';
import { Random } from 'meteor/random';
import { ShellWindow } from './ShellWindow';

export const ActivityShell = () => {
  const activities = useFind(() => {
    return EntitiesCollection.find({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Activity',
    }) as Mongo.Cursor<ActivityEntity>;
  });

  const [sessionCatalog] = useState(new SessionCatalog());
  // const sessionCatalog = useMemo(() => new SessionCatalog(), []);

  const tasks = useFind(() => sessionCatalog
    .findEntities<TaskEntity>('dist.app/v1alpha1', 'Task'));

  // const [activityCoord, setActivityCoord] = useState<{
  //   catalogId: string;
  //   namespace: string;
  //   name: string;
  // } | null>(null);

  // const activity = activities.find(x =>
  //   x.metadata.catalogId == activityCoord?.catalogId &&
  //   x.metadata.namespace == activityCoord?.namespace &&
  //   x.metadata.name == activityCoord?.name);

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
          width: 400,
          height: 300,
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
          <option disabled>fullscreen</option>
          <option disabled>grid</option>
        </select>
      </section>
      <nav className="activities-tray">
        <ul>{activities.map(activity => activity.spec
            .intentFilters?.some(x =>
              x.action == 'app.dist.Main' && x.category == 'app.dist.Launcher') ? (
          <li key={activity._id}>
            <button onClick={() => launchActivityTask(activity)}>
              {activity.metadata.namespace} {activity.metadata.name}
            </button>
          </li>
        ) : [])}</ul>
      </nav>
      <div className="shell-backdrop" />
      <div className="shell-floating-layer">
        {tasks.map(task => (
          <ShellWindow key={task._id} task={task} sessionCatalog={sessionCatalog} />
        ))}
      </div>
    </Fragment>
  );
};
