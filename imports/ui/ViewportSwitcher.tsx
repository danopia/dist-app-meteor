import { Meteor } from 'meteor/meteor';
import React, { useEffect, useMemo, useState } from 'react';
import { useTracker, useSubscribe, useFind } from 'meteor/react-meteor-data';

import { useBodyClass } from '../lib/use-body-class';
import { ProfileDoc, ProfilesCollection } from '../db/profiles';
import { useNavigate } from 'raviger';
import { ActivityShell } from './ActivityShell';
import { RuntimeProvider } from './RuntimeProvider';
import { MyCommandPalette } from './CommandPalette';
import { EntityEngine } from '../engine/EntityEngine';
import { WorkspaceEntity } from '../entities/runtime';
import { RuntimeContext } from './contexts';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../lib/error-fallback';

export const ViewportSwitcher = (props: {
  profileId?: string;
  workspaceName?: string;
}) => {

  useBodyClass('fill-body');
  useSubscribe('/v1alpha1/profiles/list');

  const navigate = useNavigate();

  const user = useTracker(() => Meteor.user(), []) as Meteor.User; // TODO: satisfies
  const profiles = useFind(() => ProfilesCollection.find(), []) as ProfileDoc[] | null; // TODO: get typings
  const profile = profiles?.find(x => x._id == props.profileId) ?? profiles?.[0];

  // TODO: useMemo is the wrong tool for this
  const engine = useMemo(() => {
    const engine = new EntityEngine();

    if (props.profileId) engine.addNamespace({
      name: 'session',
      spec: {
        layers: [{
          mode: 'ReadWrite',
          accept: [{
            apiGroup: 'runtime.dist.app',
          }, {
            apiGroup: 'profile.dist.app',
          }, {
            apiGroup: 'manifest.dist.app',
          }],
          storage: {
            type: 'profile',
            profileId: props.profileId,
            // type: 'local-inmemory',
          },
        }],
      }});

    // engine.addNamespace({
    //   name: 'profile',
    //   spec: {
    //     layers: [{
    //       mode: 'ReadWrite',
    //       accept: [{
    //         apiGroup: 'profile.dist.app',
    //       }],
    //       storage: {
    //         type: 'local-inmemory',
    //       },
    //     }],
    //   }});
    // insertGuestProfileTemplate(runtime);

    return engine;
  }, [props.profileId]);

  const workspaces = useTracker(() => engine
    .listEntities<WorkspaceEntity>(
      'runtime.dist.app/v1alpha1', 'Workspace', 'session')) as WorkspaceEntity[];

  if (!user || !profile) {
    // TODO: render the 'login' profile w/o sidebar switcher
    // AccountsAnonymous.login()
    return (
      <div className="switcher-content" style={{
          gridColumn: '2',
        }}>
        <div>hi</div>
      </div>
    );
  }

  if (!props.profileId && profile._id) {
    navigate(`/profile/${profile._id}`);
    return (<div>hi</div>);
  }

  let content = (
    <div className="switcher-content" style={{
        gridColumn: '2',
      }}>Hi!</div>
  );

  if (props.workspaceName) {
    content = (
      <div className="activity-shell-parent" style={{
          gridColumn: '2',
        }}>
        <ActivityShell guest={true} workspaceName={props.workspaceName} />
      </div>
    );
  }

  //     meteorCallAsync('/v1alpha1/get user profile').then(x => {

  return (
    <RuntimeContext.Provider value={engine}>
    {/* <RuntimeProvider profileId={profile._id} engine={engine}> */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <MyCommandPalette parentElement=".activity-shell-parent" />
      </ErrorBoundary>
      <div className="switcher-root" style={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
          width: '100vw',
          height: '100vh',
        }}>
        <ul className="switcher-menu" style={{
            display: 'flex',
            flexDirection: 'column',
            margin: 0,
            padding: '0.5em',
            gap: '0.5em',
            listStyle: 'none',
            borderRight: '1px solid gray',
            gridColumn: '1',
          }}>
          <li style={{
              display: 'grid',
              width: '3em',
              height: '3em',
            }}>
            <button style={{
                border: '1px solid gray',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: 'gray',
              }} />
          </li>
          <li style={{
              display: 'grid',
              width: '3em',
            }}>
            <select style={{
                width: '100%',
              }}>
              {profiles?.map(x => (
                <option key={x._id}>
                  {x.description ?? `${x._id.slice(0,4)}...`}
                </option>
              )) ?? []}
            </select>
          </li>
          {workspaces.map(x => (
            <li key={x.metadata.name} style={{
                display: 'grid',
                width: '3em',
                height: '3em',
              }}>
              <button style={{
                  border: '1px solid gray',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.2em',
                }} onClick={() => {
                  navigate(`/profile/${profile._id}/workspace/${x.metadata.name}`);
                }}>Shell</button>
            </li>
          ))}
          <li style={{
              display: 'grid',
              width: '3em',
              height: '3em',
            }}>
            <button style={{
                border: '1px solid gray',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.2em',
              }} onClick={async () => {
                const workspaceName = `shell-${Math.random().toString(16).slice(2,6)}`;
                await engine.insertEntity<WorkspaceEntity>({
                  apiVersion: 'runtime.dist.app/v1alpha1',
                  kind: 'Workspace',
                  metadata: {
                    name: workspaceName,//'main',
                    namespace: 'session',
                  },
                  spec: {
                    windowOrder: [],
                  },
                });
                navigate(`/profile/${profile._id}/workspace/${workspaceName}`);
              }}>+</button>
          </li>
        </ul>
        {content}
      </div>
    </RuntimeContext.Provider>
  );

};
