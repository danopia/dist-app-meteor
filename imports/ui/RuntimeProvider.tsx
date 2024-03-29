import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { RuntimeContext } from './contexts';
import { insertGuestWelcomeSession, newEngineWithGuestProfile } from '../engine/EngineFactory';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { FrameEntity, WorkspaceEntity } from '../entities/runtime';
import { meteorCallAsync } from '../lib/meteor-call';
import { EntityEngine } from '../engine/EntityEngine';

export const RuntimeProvider = (props: {
  children: ReactNode;
  engine?: EntityEngine;
  profileId?: string;
}) => {
  const runtime = useMemo(() => {
    if (props.engine) return props.engine;

    const runtime = newEngineWithGuestProfile();

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

    insertGuestWelcomeSession(runtime);

    return runtime;
  }, [props.engine]);
  //@ts-expect-error globalThis.runtime
  globalThis.runtime = runtime;

  const userId = useTracker(() => Meteor.userId(), []);
  const [profileId, setProfileId] = useState<string|null>(props.profileId ?? null);
  useEffect(() => {
    if (props.profileId) return;
    let isUs = true;
    meteorCallAsync('/v1alpha1/get user profile').then(x => {
      if (!isUs) return;
      setProfileId(`${x}`);
    });
    return () => { isUs = false };
  }, [userId]);

  // Register the user's server profile
  useEffect(() => {
    console.log('Replacing user ns', runtime.namespaces.get('profile:user'))
    runtime.namespaces.delete('profile:user');
    if (profileId) {
      runtime.addNamespace({
        name: 'profile:user',
        spec: {
          layers: [{
            mode: 'ReadWrite',
            accept: [{
              // apiGroup: 'profile.dist.app',
            }],
            storage: {
              type: 'profile',
              profileId: profileId,
            },
          }],
        }});
    }
  }, [profileId]);











  // // useEffect(() => {
  // //   const ourName = workspace?.spec.savedSessionName;
  // //   const queryName = savedSession as string | undefined;
  // //   if (ourName && ((queryName ?? '') !== (ourName ?? ''))) {
  // //     setQuery({savedSession: ourName}, {replace: true});
  // //   }
  // // }, []);
  // const [targetSession, setTargetSession] = useState<string|null|false>(false);
  // useEffect(() => {
  //   const ourName = workspace?.spec.savedSessionName;
  //   const queryName = props.savedSessionName;
  //   if (workspace && ourName != queryName) {
  //     // setQuery({savedSession: ourName}, {replace: true});
  //     console.log('Names differ:', {ourName, queryName});
  //     setTargetSession(queryName ?? null);
  //   }
  // }, [workspace, props.savedSessionName]);

  // const targetSessionEntity = useTracker(() => {
  //   if (typeof targetSession !== 'string') return targetSession;
  //   try {
  //     const entity = runtime.getEntity<SavedSessionEntity>(
  //       'profile.dist.app/v1alpha1', 'SavedSession',
  //       'profile:user', targetSession);
  //     if (!entity) return false; // no entity found, do nothing
  //     return entity;
  //   } catch (err) {
  //     console.log(`Ignoring targetSessionEntity error:`, (err as Error).message);
  //     return false;
  //   }
  // });

  // useEffect(() => {
  //   if (targetSessionEntity === false) return;
  //   // console.log('Desired name:', targetSession);
  //   console.log('Desired entity:', targetSessionEntity);
  //   setTargetSession(false);

  //   // const sessionEntity = targetSession ? runtime.getEntity<SavedSessionEntity>(
  //   //   'profile.dist.app/v1alpha1', 'SavedSession',
  //   //   'profile:user', targetSession) : false;
  //   // if (sessionEntity != )

  //   const ns = runtime.namespaces.get('session');
  //   const layer = ns?.selectLayer({
  //     apiGroup: 'runtime.dist.app',
  //     apiVersion: 'v1alpha1',
  //     kind: 'Workspace',
  //     op: 'Read',
  //   });
  //   if (!layer) throw new Error(`TODO: no layer`);
  //   if (!(layer.impl instanceof MongoEntityStorage)) throw new Error(`TODO: other runtime storages`);

  //   // 1. Delete all of the current junk
  //   for (const entity of layer.impl.listAllEntities()) {
  //     layer.impl.deleteEntity(entity.apiVersion, entity.kind, entity.metadata.name);
  //   }

  //   // 2. What were we doing again?
  //   if (targetSessionEntity) {
  //     for (const json of targetSessionEntity.spec.jsonEntities) {
  //       const rawEntity = EJSON.parse(json) as unknown as ArbitraryEntity;
  //       if (rawEntity.apiVersion == 'runtime.dist.app/v1alpha1' && rawEntity.kind == 'Workspace') {
  //         const workspaceEntity = rawEntity as WorkspaceEntity;
  //         workspaceEntity.spec.savedSessionName = targetSessionEntity.metadata.name;
  //       }
  //       layer.impl.insertEntity(rawEntity);
  //     }
  //   } else {

  //   }

  // }, [targetSessionEntity]);











  return (
    <RuntimeContext.Provider value={runtime}>
      {props.children}
    </RuntimeContext.Provider>
  );
};
