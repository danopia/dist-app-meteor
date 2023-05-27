import { Meteor } from 'meteor/meteor';
import React, { useEffect, useMemo } from 'react';
import { useTracker, useSubscribe, useFind } from 'meteor/react-meteor-data';

import { useBodyClass } from '../lib/use-body-class';
import { ProfilesCollection } from '../db/profiles';
import { useNavigate } from 'raviger';
import { ActivityShell } from './ActivityShell';
import { MyCommandPalette } from './CommandPalette';
import { EntityEngine } from '../engine/EntityEngine';
import { WorkspaceEntity } from '../entities/runtime';
import { RuntimeContext } from './contexts';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../lib/error-fallback';
import { AppInstallationEntity } from '../entities/profile';
import { launchNewIntent } from './logic/launch-app';

export const ViewportSwitcher = (props: {
  profileId?: string;
  workspaceName?: string;
}) => {
  let {
    profileId,
    workspaceName,
  } = props;
  let showSwitcher = true;

  useBodyClass('fill-body');
  useSubscribe('/v1alpha1/profiles/list');

  const navigate = useNavigate();

  const user = useTracker(() => Meteor.user(), []);
  if (user === null) {
    profileId = 'login';
    workspaceName = 'login';
    showSwitcher = false;
  }

  const profiles = useFind(() => ProfilesCollection.find(), []);
  const profile = profiles?.find(x => x._id == profileId) ?? profiles?.[0];

  useSubscribe(profile && '/v1alpha1/profiles/by-id/composite', profile?._id);

  // TODO: useMemo is the wrong tool for this
  const engine = useMemo(() => {
    const engine = new EntityEngine();

    if (profileId == 'login') {
      engine.addNamespace({
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
        },
      });
      engine.addNamespace({
        name: 'login',
        spec: {
          layers: [{
            // mode: 'ReadWrite',
            mode: 'ReadOnly',
            accept: [{
              apiGroup: 'profile.dist.app',
            }],
            storage: {
              type: 'profile',
              profileId: 'login',
              // type: 'local-inmemory',
            },
          }],
        },
      });
      // engine.insertEntity<AppInstallationEntity>({
      //   apiVersion: 'profile.dist.app/v1alpha1',
      //   kind: 'AppInstallation',
      //   metadata: {
      //     name: `welcome`,
      //     namespace: 'login',
      //   },
      //   spec: {
      //     appUri: `bundled:${encodeURIComponent('app:welcome')}`,
      //     // isInLauncher: true,
      //     launcherIcons: [{
      //       action: 'app.dist.Main',
      //     }],
      //     preferences: {},
      //   },
      // });
      engine.insertEntity<WorkspaceEntity>({
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Workspace',
        metadata: {
          name: 'login',
          namespace: 'session',
        },
        spec: {
          windowOrder: [],
        },
      });
      launchNewIntent(engine, 'login', {
        receiverRef: `entity://login/profile.dist.app/v1alpha1/AppInstallation/app:welcome`,
        action: 'app.dist.Main',
        category: 'app.dist.Launcher',
      });

    } else {
      engine.addNamespace({
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
              profileId: profileId!,
              // type: 'local-inmemory',
            },
          }],
        }});

      engine.addNamespace({
        name: 'market-index',
        spec: {
          layers: [{
            mode: 'ReadOnly',
            accept: [{
              apiGroup: 'market.dist.app',
            }],
            storage: {
              type: 'foreign-ddp',
              remoteUrl: 'https://dist-v1alpha1.deno.dev',
              catalogId: 'public-index',
            },
          }],
        },
      });
    }

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
  }, [profileId]);

  const workspaces = useTracker(() => engine
    .listEntities<WorkspaceEntity>(
      'runtime.dist.app/v1alpha1', 'Workspace', 'session')) as WorkspaceEntity[];

  useEffect(() => {
    if (!profile) {
      Meteor.callAsync('/v1alpha1/get user profile');
    }
  }, [user]);

  // if (!user) {
  //   // TODO: render the 'login' profile w/o sidebar switcher
  //   // AccountsAnonymous.login()
  //   return (
  //     <RuntimeContext.Provider value={engine}>
  //       <div className="activity-shell-parent" style={{
  //           gridColumn: '2',
  //         }}>
  //         <ActivityShell guest={true} workspaceName={"login"} />
  //       </div>
  //     </RuntimeContext.Provider>
  //   );
  // }
  if (!profile) {
    // TODO: render the 'login' profile w/o sidebar switcher
    // AccountsAnonymous.login()
    return (
      <div className="switcher-content" style={{
          gridColumn: '2',
        }}>
        <div>no profile</div>
      </div>
    );
  }

  // if (user && !props.profileId) {
  //   navigate(`/profile/login`);
  //   return (
  //     <div>Redirecting to login</div>
  //   );
  // }

  if (!profileId && profile._id) {
    navigate(`/profile/${profile._id}`);
    return (
      <div>Redirecting to profile</div>
    );
  }

  let content = (
    <div className="switcher-content" style={{
        gridColumn: '2',
      }}>No content!</div>
  );

  if (workspaceName) {
    content = (
      <div className="activity-shell-parent" style={{
          gridColumn: '2',
        }}>
        <ActivityShell guest={true} workspaceName={workspaceName} />
      </div>
    );
  } else if (workspaces.length >= 1) {
    navigate(`/profile/${profile._id}/workspace/${workspaces[0].metadata.name}`);
  }

  //     meteorCallAsync('/v1alpha1/get user profile').then(x => {

  return (
    <RuntimeContext.Provider value={engine}>
    {/* <RuntimeProvider profileId={profile._id} engine={engine}> */}
      <div className="switcher-root" style={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
          width: '100vw',
          height: '100vh',
        }}>
        {showSwitcher ? (
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
        ) : []}
        {content}
      </div>
    </RuntimeContext.Provider>
  );

};
