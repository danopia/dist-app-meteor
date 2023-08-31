import { Meteor } from 'meteor/meteor';
import React, { useContext, useEffect, useMemo } from 'react';
import { useTracker, useSubscribe, useFind } from 'meteor/react-meteor-data';

import { useBodyClass } from '../lib/use-body-class';
import { ProfilesCollection } from '../db/profiles';
import { useNavigate } from 'raviger';
import { ActivityShell } from './ActivityShell';
import { EntityEngine } from '../engine/EntityEngine';
import { FrameEntity, WorkspaceEntity } from '../entities/runtime';
import { RuntimeContext } from './contexts';
import { launchNewIntent } from './logic/launch-app';
import { marketUrl } from '../settings';
import { remoteConns } from '../engine/EntityStorage';

import './ViewportSwitcher.css';

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

      engine.useRemoteNamespace(marketUrl);
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
      <div className="switcher-root">
        {showSwitcher ? (
          <ul className="switcher-menu">
            <li className="switcher-icon" style={{justifyItems: 'center'}}>
              <button className="switcher-profile-photo" style={{
                  backgroundColor: 'gray',
                }} />
            </li>
            <li style={{
                display: 'grid',
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
            {workspaces.map(x => (<>
              <li key={x.metadata.name} className="switcher-icon">
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }} onClick={() => {
                    navigate(`/profile/${profile._id}/workspace/${x.metadata.name}`);
                  }}>Shell</button>
              </li>
              <WorkspaceContents key={x.metadata.name+"-contents"}
                  workspaceName={x.metadata.name}
                  profileId={profile._id}
                />
            </>))}
            <li className="switcher-icon">
              <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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

            <div style={{flex: 1}} />

            {connections.map((conn, connIdx) => (
              <li key={connIdx}>
                <div title={conn.label}>srv{connIdx}</div>
                <div style={{fontSize: '0.6em'}}>{conn.status.status}</div>
                <button style={{fontSize: '0.6em', padding: '0.2em 0', display: 'block', width: '100%'}} type="button" disabled={conn.status.connected} onClick={conn.reconnect}>reconnect</button>
              </li>
            ))}

            {user ? (<>
              <button style={{fontSize: '0.7em', padding: '0.5em 0', display: 'block', width: '100%'}} type="button" onClick={() => Meteor.logout()}>Sign out</button>
            </>) : []}

          </ul>
        ) : []}
        {content}
      </div>
    </RuntimeContext.Provider>
  );

};

const WorkspaceContents = (props: {
  workspaceName: string;
  profileId: string;
}) => {

  const navigate = useNavigate();

  const runtime = useContext(RuntimeContext);

  // please let this techdebt die
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName);

  const frames = useTracker(() => runtime
    .listEntities<FrameEntity>(
      'runtime.dist.app/v1alpha1', 'Frame',
      'session',
    )
    .filter(x => x.metadata.ownerReferences?.some(y => y.name == props.workspaceName))
  , [runtime, props.workspaceName]);

  return (<>
    {frames.map(frame => (
      <div className="one-tab" key={frame.metadata.name}>
        <button className="main" type="button" onClick={() => {
          navigate(`/profile/${props.profileId}/workspace/${props.workspaceName}`);
          shell?.runTaskCommand(frame, null, {
            type: 'bring-to-top',
          });
        }}>{frame.metadata?.title ?? frame.metadata.name}</button>
        <button className="action" type="button" onClick={() => {
          shell?.runTaskCommand(frame, null, {
            type: 'delete-task',
          });
        }}>x</button>
      </div>
    ))}
  </>);
}
