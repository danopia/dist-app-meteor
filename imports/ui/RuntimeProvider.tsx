import React, { ReactNode, useMemo } from 'react';
import { RuntimeContext } from './contexts';
import { EngineFactory, insertGuestTemplate } from '../engine/EngineFactory';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { EntityEngine } from '../engine/EntityEngine';
import { WorkspaceEntity } from '../entities/runtime';

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

    runtime.addNamespace({
      name: 'profile:guest',
      spec: {
        layers: [{
          mode: 'ReadWrite',
          accept: [{
            apiGroup: 'profile.dist.app',
          }],
          storage: {
            type: 'local-inmemory',
          },
        }],
      }});

    runtime.insertEntity<WorkspaceEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Workspace',
      metadata: {
        name: 'main',
        namespace: 'session',
      },
      spec: {
        windowOrder: [],
      },
    });

    insertGuestTemplate(runtime);

    return runtime;
  }, []);
  //@ts-expect-error globalThis.runtime
  globalThis.runtime = runtime;

  // Register the user's server profile
  useTracker(() => {
    runtime.namespaces.delete('profile:user');

    const userId = Meteor.userId();
    if (!userId) return;

    runtime.addNamespace({
      name: 'profile:user',
      spec: {
        layers: [{
          mode: 'ReadWrite',
          accept: [{
            apiGroup: 'profile.dist.app',
          }],
          storage: {
            type: 'profile',
            profileId: userId,
          },
        }],
      }});
  }, []);

  return (
    <RuntimeContext.Provider value={runtime}>
      {props.children}
    </RuntimeContext.Provider>
  );
};
