import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, navigate } from 'raviger';
import React, { useEffect, useMemo } from 'react';

import { ActivityShell } from '../ActivityShell';
import { launchNewIntent } from '../logic/launch-app';
import { EntityEngine } from '/imports/engine/EntityEngine';
import { remoteConns } from '/imports/engine/EntityStorage';
import { AppInstallationEntity } from '/imports/entities/profile';
import { WorkspaceEntity } from '/imports/entities/runtime';
import { useBodyClass } from '/imports/lib/use-body-class';
import { marketUrl } from '/imports/settings';
import { RuntimeContext } from '../contexts';
import { FrameSwitcher } from '../FrameSwitcher';
import { AppListingEntity } from '/imports/runtime/system-apis/market';

export const LaunchPublicApp = (props: {
  appListingName: string;
}) => {

  useBodyClass('fill-body');

  const navigate = useNavigate();

  const user = useTracker(() => Meteor.user(), []);
  // useSubscribe('/v1alpha1/profiles/list');
  // const profiles = useFind(() => ProfilesCollection.find(), []);
  // const profile = profiles?.find(x => x._id == profileId) ?? profiles?.[0];
  // useSubscribe(profile && '/v1alpha1/profiles/by-id/composite', profile?._id);

  // return (
  //   <div>hi! you want AppListing {props.appListingName}</div>
  // );









  // TODO: useMemo is the wrong tool for this
  const engine = useMemo(() => {
    const engine = new EntityEngine();

    engine.addNamespace({
      name: 'login',
      spec: {
        layers: [{
          mode: 'ReadWrite',
          // mode: 'ReadOnly',
          accept: [{
            apiGroup: 'profile.dist.app',
          }],
          storage: {
            // type: 'profile',
            // profileId: 'login',
            type: 'local-inmemory',
          },
        }],
      },
    });

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
    engine.insertEntity<WorkspaceEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Workspace',
      metadata: {
        name: 'primary',
        namespace: 'session',
      },
      spec: {
        windowOrder: [],
        frameMode: 'tabbed',
      },
    });

    // // For debugging purposes, also open an Explorer:
    // launchNewIntent(engine, 'primary', {
    //   receiverRef: `internal://explorer`,
    //   action: 'app.dist.Main',
    //   category: 'app.dist.Launcher',
    // }, 'default-explorer');

    return engine;
  }, [props.appListingName]);

  // TODO: why does putting useRemoteNamespace before launchNewIntent block the intent?
  const publicIndex = useMemo(() => engine
    .useRemoteNamespace(marketUrl)
  , [engine, marketUrl]);

  const appListing = useTracker(() => engine
    .getEntity<AppListingEntity>(
      'market.dist.app/v1alpha1', 'AppListing',
      publicIndex, props.appListingName)
  , [engine, publicIndex, props.appListingName]);

  // Effect: install and launch the app, once its AppListing is available
  useEffect(() => {
    if (!appListing) return;

    const appDataUrl = `ddp-catalog://${marketUrl.split('/')[2]}/${encodeURIComponent(appListing.spec.developmentDistUrl!.split(':')[1])}`;
    // appUri: `bundled:${encodeURIComponent('app:welcome')}`,

    // TODO: use app.dist.InstallApp to install the application, once it can finish unattended.
    engine.insertEntity<AppInstallationEntity>({
      apiVersion: 'profile.dist.app/v1alpha1',
      kind: 'AppInstallation',
      metadata: {
        name: 'primary',
        namespace: 'login',
      },
      spec: {
        appUri: appDataUrl,
        launcherIcons: [{
          action: 'app.dist.Main',
        }],
        preferences: {},
      },
    }).then(async () => {

      // TODO: intent screen doesn't recover if launched before entities are available
      await new Promise(ok => setTimeout(ok, 1000));

      await launchNewIntent(engine, 'primary', {
        receiverRef: `entity://login/profile.dist.app/v1alpha1/AppInstallation/primary`,
        action: 'app.dist.Main',
        category: 'app.dist.Launcher',
      }, 'default-app');
    });

  }, [engine, appListing]);

  const [workspace] = useTracker(() => engine
    .listEntities<WorkspaceEntity>(
      'runtime.dist.app/v1alpha1', 'Workspace', 'session')) as WorkspaceEntity[];

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

  if (!workspace) {
    return (
      <div className="switcher-content" style={{
          gridColumn: '2',
        }}>
        <div>no workspace...</div>
      </div>
    );
  }

  if (false) {
    return (
      <div className="switcher-content" style={{
          gridColumn: '2',
        }}>
        <div>launching app...</div>
      </div>
    );
  }

  const content = (
    <div className="activity-shell-parent" style={{
        gridColumn: '2',
      }}>
      <ActivityShell guest={true} workspaceName='primary' />
    </div>
  );

  return (
    <RuntimeContext.Provider value={engine}>
      <div className="switcher-root">
          <ul className="switcher-menu">
            {/* <li className="switcher-icon" style={{justifyItems: 'center'}}>
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
            </li> */}
              <FrameSwitcher
                  workspaceName={workspace.metadata.name}
                />

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
        {content}
      </div>
    </RuntimeContext.Provider>
  );

};
