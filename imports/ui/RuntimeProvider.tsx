import React, { ReactNode, useMemo } from 'react';
import { RuntimeContext } from './contexts';
import { EngineFactory } from '../engine/EngineFactory';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { EntityEngine } from '../engine/EntityEngine';

export const RuntimeProvider = (props: {
  children: ReactNode;
}) => {
  const runtime = useMemo(() => {
    const runtime = new EntityEngine();

    runtime.addNamespace({
      name: 'session',
      spec: {
        layers: [{
          mode: 'ReadWrite',
          accept: [{
            apiGroup: 'runtime.dist.app',
          }],
          storage: {
            type: 'local-inmemory',
          },
        }],
      }});

    return runtime;
  }, []);
  //@ts-expect-error globalThis.runtime
  globalThis.runtime = runtime;

  return (
    <RuntimeContext.Provider value={runtime}>
      {props.children}
    </RuntimeContext.Provider>
  );
};
