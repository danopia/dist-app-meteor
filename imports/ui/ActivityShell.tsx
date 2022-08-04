import React, { Fragment, useState } from 'react';
import { useFind, useTracker } from 'meteor/react-meteor-data';
import { ActivityEntity, EntitiesCollection } from '../db/entities';
import { Mongo } from 'meteor/mongo';

export const ActivityShell = () => {
  const activities = useFind(() => {
    return EntitiesCollection.find({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Activity',
    }) as Mongo.Cursor<ActivityEntity>;
  });

  const [activityCoord, setActivityCoord] = useState<{
    namespace: string;
    name: string;
  } | null>(null);

  const activity = activities.find(x =>
    x.metadata.namespace == activityCoord?.namespace &&
    x.metadata.name == activityCoord?.name);

  return (
    <Fragment>
      <nav className="activities-tray">
        <ul>{activities.map(activity => activity.spec.type == 'frame' ? (
          <li key={activity._id}>
            <button onClick={() => setActivityCoord({namespace: activity.metadata.namespace!, name: activity.metadata.name})}>
              {activity.metadata.namespace} {activity.metadata.name}
            </button>
          </li>
        ) : [])}</ul>
      </nav>
      {activity?.spec.type == 'frame' ? (
        <iframe className="activity-outer" src={activity.spec.frame.sourceUrl} sandbox="allow-scripts allow-forms allow-modals" />
      ) : []}
    </Fragment>
  );
};
