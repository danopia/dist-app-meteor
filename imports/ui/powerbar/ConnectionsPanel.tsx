import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import { remoteConns } from '/imports/engine/EntityStorage';

export const ConnectionsPanel = () => {
  const connections = useTracker(() => {
    const allConns = [{
      label: Meteor.absoluteUrl(),
      reconnect: () => Meteor.reconnect(),
      status: Meteor.status(),
    }];
    for (const [url, conn] of remoteConns.entries()) {
      allConns.push({
        label: url,
        reconnect: () => conn.reconnect(),
        status: conn.status(),
      });
    }
    return allConns;
  }, []);

  return (<>
    {connections.map((conn, connIdx) => (
      <li key={connIdx}>
        <div title={conn.label}>srv{connIdx}</div>
        <div style={{fontSize: '0.6em'}}>{conn.status.status}</div>
        <button style={{fontSize: '0.6em', padding: '0.2em 0', display: 'block', width: '100%'}} type="button" disabled={conn.status.connected} onClick={conn.reconnect}>reconnect</button>
      </li>
    ))}
  </>);
};
