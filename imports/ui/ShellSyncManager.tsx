import { useDebounce } from "@react-hook/debounce";
import { EJSON } from "meteor/ejson";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { useTracker } from "meteor/react-meteor-data";
import { navigate } from "raviger";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { insertGuestWelcomeSession } from "../engine/EngineFactory";
import { MongoEntityStorage } from "../engine/EntityStorage";
import { ArbitraryEntity } from "../entities/core";
import { SavedSessionEntity } from "../entities/profile";
import { WorkspaceEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";

export const ShellSyncManager = (props: {
  savedSessionName?: string;
}) => {
  const user = useTracker(() => Meteor.user(), []);

  const runtime = useContext(RuntimeContext);
  const workspace = useTracker(() => runtime
    .getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main'), [runtime]);





  // useEffect(() => {
  //   const ourName = workspace?.spec.savedSessionName;
  //   const queryName = savedSession as string | undefined;
  //   if (ourName && ((queryName ?? '') !== (ourName ?? ''))) {
  //     setQuery({savedSession: ourName}, {replace: true});
  //   }
  // }, []);
  const [targetSession, setTargetSession] = useState<string|null|false>(false);
  useEffect(() => {
    const ourName = workspace?.spec.savedSessionName;
    const queryName = props.savedSessionName;
    if (workspace && ourName != queryName) {
      // setQuery({savedSession: ourName}, {replace: true});
      console.log('Names differ:', {ourName, queryName});
      setTargetSession(queryName ?? null);
    }
  }, [workspace, props.savedSessionName]);

  const targetSessionEntity = useTracker(() => {
    if (typeof targetSession !== 'string') return targetSession;
    try {
      const entity = runtime.getEntity<SavedSessionEntity>(
        'profile.dist.app/v1alpha1', 'SavedSession',
        'profile:user', targetSession);
      if (!entity) return false; // no entity found, do nothing
      return entity;
    } catch (err) {
      console.log(`Ignoring targetSessionEntity error:`, (err as Error).message);
      return false;
    }
  });

  useEffect(() => {
    if (targetSessionEntity === false) return;
    // console.log('Desired name:', targetSession);
    console.log('Desired entity:', targetSessionEntity);
    setTargetSession(false);

    // const sessionEntity = targetSession ? runtime.getEntity<SavedSessionEntity>(
    //   'profile.dist.app/v1alpha1', 'SavedSession',
    //   'profile:user', targetSession) : false;
    // if (sessionEntity != )

    downloadSession(targetSessionEntity);
  }, [targetSessionEntity]);



  const downloadSession = useCallback((targetSessionEntity: SavedSessionEntity | null) => {
    const ns = runtime.namespaces.get('session');
    const layer = ns?.selectLayer({
      apiGroup: 'runtime.dist.app',
      apiVersion: 'v1alpha1',
      kind: 'Workspace',
      op: 'Read',
    });
    if (!layer) throw new Error(`TODO: no layer`);
    if (!(layer.impl instanceof MongoEntityStorage)) throw new Error(`TODO: other runtime storages`);

    // 1. Delete all of the current junk
    for (const entity of layer.impl.listAllEntities()) {
      layer.impl.deleteEntity(entity.apiVersion, entity.kind, entity.metadata.name);
    }

    // 2. What were we doing again?
    if (targetSessionEntity) {
      for (const json of targetSessionEntity.spec.jsonEntities) {
        const rawEntity = EJSON.parse(json) as unknown as ArbitraryEntity;
        if (rawEntity.apiVersion == 'runtime.dist.app/v1alpha1' && rawEntity.kind == 'Workspace') {
          const workspaceEntity = rawEntity as WorkspaceEntity;
          workspaceEntity.spec.savedSessionName = targetSessionEntity.metadata.name;
        }
        layer.impl.insertEntity(rawEntity);
      }
    } else {
      insertGuestWelcomeSession(runtime);
    }
  }, [runtime]);


  const uploadSession = useCallback(async () => {
    // const sessionName = workspace?.spec.savedSessionName ?? Random.id();

    const ns = runtime.namespaces.get('session');
    const layer = ns?.selectLayer({
      apiGroup: 'runtime.dist.app',
      apiVersion: 'v1alpha1',
      kind: 'Workspace',
      op: 'Read',
    });
    if (!layer) throw new Error(`TODO: no layer`);
    if (!(layer.impl instanceof MongoEntityStorage)) throw new Error(`TODO: other runtime storages`);
    const jsons = layer.impl.listAllEntities().map(x => {
      // if (x.kind == 'SavedSession' && x.metadata.name == 'main') {
      //   return EJSON.stringify({ ...x,
      //     spec: {
      //       ...(x as unknown as SavedSessionEntity).spec,
      //       savedSessionName: sessionName, // TODO: should be a ref
      //     },
      //   });
      // }
      return EJSON.stringify({ ...x });
    });
    console.log('Serialized session JSONs:', jsons.map(x => EJSON.parse(x)));

    if (workspace?.spec.savedSessionName) {
      await runtime.mutateEntity<SavedSessionEntity>(
        'profile.dist.app/v1alpha1', 'SavedSession',
        'profile:user', workspace.spec.savedSessionName,
        x => {
          x.spec.jsonEntities = jsons;
        });
      console.log('Updated existing SavedSession', workspace.spec.savedSessionName);

    } else {
      const sessionName = Random.id();
      // await runtime.mutateEntity<WorkspaceEntity>(
      //   "runtime.dist.app/v1alpha1", 'Workspace',
      //   'session', 'main',
      //   x => {
      //     x.spec.savedSessionName = sessionName; // TODO: should be a ref
      //   });
      await runtime.insertEntity<SavedSessionEntity>({
        apiVersion: 'profile.dist.app/v1alpha1',
        kind: "SavedSession",
        metadata: {
          namespace: 'profile:user',
          name: sessionName,
        },
        spec: {
          jsonEntities: jsons,
        },
      });
      console.log('Created new SavedSession', sessionName);
      navigate('/desktop/saved-session/'+sessionName);
    }

  }, [runtime, workspace]);

  return user
    ? (<>
      {workspace?.spec.savedSessionName ? (<>
        <div style={{alignSelf: 'center', margin: '0.1em 1em'}}>
          {workspace?.spec.savedSessionName}
        </div>
        <button type="button" onClick={() => {
          const entity = runtime.getEntity<SavedSessionEntity>(
            'profile.dist.app/v1alpha1', 'SavedSession',
            'profile:user', workspace.spec.savedSessionName!);
          downloadSession(entity);
        }}>Reload</button>
      </>) : []}
      <button type="button" onClick={() => uploadSession()}>Upload session</button>
    </>)
    : <></>;
}
