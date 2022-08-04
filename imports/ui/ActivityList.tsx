import React from 'react';
import { useFind, useTracker } from 'meteor/react-meteor-data';
import { ActivityEntity, EntitiesCollection } from '../db/entities';
import { Mongo } from 'meteor/mongo';

export const ActivityList = () => {
  const activities = useFind(() => {
    return EntitiesCollection.find({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Activity',
    }) as Mongo.Cursor<ActivityEntity>;
  });

  return (
    <div>
      <h2>Learn Meteor!</h2>
      <ul>{activities.map(activity => activity.spec.type == 'frame' ? (
        <li key={activity._id}>
          <a href={activity.spec.frame.sourceUrl} target="_blank">{activity.metadata.namespace} {activity.metadata.name}</a>
        </li>
      ) : [])}</ul>
    </div>
  );
};
