import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import { remoteConns } from '/imports/engine/EntityStorage';

export const ConnectionsPanel = () => {
  const connections = useTracker(() => {
    const allConns = [{
      label: Meteor.absoluteUrl(),
      reconnect: () => Meteor.reconnect(),
      disconnect: () => Meteor.disconnect(),
      status: Meteor.status(),
    }];
    for (const [url, conn] of remoteConns.entries()) {
      allConns.push({
        label: url,
        reconnect: () => conn.reconnect(),
        disconnect: () => conn.disconnect(),
        status: conn.status(),
      });
    }
    return allConns;
  }, []);

  return (<>
    {connections.map((conn, connIdx) => (
      <li key={connIdx}>
        <div style={{fontSize: '0.7em'}} title={conn.label}>{new URL(conn.label).host.split('.')[0]}</div>
        <div style={{fontSize: '0.6em', margin: '1px 0 3px'}}>
          {conn.status.connected ? (
            <div style={{width: '8px', aspectRatio: '1', borderRadius: '50%', backgroundColor: 'green', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3em'}} />
          ) : []}
          {conn.status.status}</div>
          <div style={{display: 'flex', gap: '0.2em', justifyContent: 'center'}}>
            <button style={{fontSize: '0.6em', padding: '0.2em 0', display: 'block', aspectRatio: '1'}} type="button" title="Reconnect now" disabled={conn.status.connected} onClick={conn.reconnect}>↻</button>
            <button style={{fontSize: '0.6em', padding: '0.2em 0', display: 'block', aspectRatio: '1'}} type="button" title="Go offline" disabled={conn.status.status == 'offline'} onClick={conn.disconnect}>×</button>
          </div>
      </li>
    ))}
  </>);
};
