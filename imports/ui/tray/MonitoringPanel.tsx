import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import { TraceCollection } from '/imports/lib/telemetry-store';

export const MonitoringPanel = () => {
  const pendingTraces = useTracker(() => {
    return TraceCollection.find({rootSpan: {$exists: false}}).fetch();
  });

  return (<>
    <li style={{fontSize: '0.8em'}}>{pendingTraces.length} pending tasks</li>
    {pendingTraces.map((trace) => (
      <li key={trace._id} style={{fontSize: '0.8em'}}>{trace.operationNames[0]}</li>
    ))}
  </>);
};
