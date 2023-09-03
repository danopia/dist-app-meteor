import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useEffect, useMemo, useRef } from 'react';

import { ActivityShell } from '../ActivityShell';
import { EntityEngine } from '/imports/engine/EntityEngine';
import { AppInstallationEntity } from '/imports/entities/profile';
import { WorkspaceEntity } from '/imports/entities/runtime';
import { useBodyClass } from '/imports/lib/use-body-class';
import { marketUrl } from '/imports/settings';
import { RuntimeContext } from '../contexts';
import { FrameSwitcher } from '../FrameSwitcher';
import { AppListingEntity } from '/imports/runtime/system-apis/market';
import { AppIcon } from '../widgets/AppIcon';
import { launchNewIntent } from '/imports/runtime/workspace-actions';
import { ConnectionsPanel } from '../powerbar/ConnectionsPanel';

export const LaunchPublicApp = (props: {
  appListingName: string;
}) => {

  useBodyClass('fill-body');

  const user = useTracker(() => Meteor.user(), []);
  // useSubscribe('/v1alpha1/profiles/list');
  // const profiles = useFind(() => ProfilesCollection.find(), []);
  // const profile = profiles?.find(x => x._id == profileId) ?? profiles?.[0];
  // useSubscribe(profile && '/v1alpha1/profiles/by-id/composite', profile?._id);


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

    return engine;
  }, [props.appListingName]);

  // TODO: why does putting useRemoteNamespace before launchNewIntent block the intent?
  const publicIndex = useMemo(() => engine
    .useRemoteNamespace(marketUrl)
  , [engine, marketUrl]);

  const hWorkspace = useMemo(() => engine
    .getEntityHandle<WorkspaceEntity>(
      'runtime.dist.app/v1alpha1', 'Workspace',
      'session', 'primary'), [engine]);

  // For debugging purposes, also open an Explorer:
  const explorerSetup = useRef<typeof hWorkspace | null>(null);
  useEffect(() => {
    if (explorerSetup.current == hWorkspace) return;
    explorerSetup.current = hWorkspace;
    launchNewIntent(hWorkspace, {
      receiverRef: `internal://explorer`,
      action: 'app.dist.Main',
      category: 'app.dist.Launcher',
    }, 'default-explorer');
  }, [hWorkspace, explorerSetup]);

  const appListing = useTracker(() => engine
    .getEntity<AppListingEntity>(
      'market.dist.app/v1alpha1', 'AppListing',
      publicIndex, props.appListingName)
  , [engine, publicIndex, props.appListingName]);

  // Effect: install and launch the app, once its AppListing is available
  const appSetup = useRef<typeof hWorkspace | null>(null);
  useEffect(() => {
    if (!appListing) return;

    if (appSetup.current == hWorkspace) return;
    appSetup.current = hWorkspace;

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

      await launchNewIntent(hWorkspace, {
        receiverRef: `entity://login/profile.dist.app/v1alpha1/AppInstallation/primary`,
        action: 'app.dist.Main',
        category: 'app.dist.Launcher',
      }, 'default-app');
    });

  }, [appSetup, engine, appListing]);

  const workspace = useTracker(() => hWorkspace.get(), [hWorkspace]);

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
            <li className="switcher-icon" style={{justifyItems: 'center'}}>
              <AppIcon className="appIcon" iconSpec={appListing?.spec.icon ?? {
                type: 'glyph',
                glyph: {
                  text: '⏳',
                  backgroundColor: 'rgba(127, 127, 127, .5)',
                },
              }} sizeRatio={2} />
              {/* <button className="switcher-profile-photo" style={{
                  backgroundColor: 'gray',
                }} /> */}
            </li>
            {/* <li style={{
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
                  hWorkspace={hWorkspace}
                />

            <div style={{flex: 1}} />

            <ConnectionsPanel />

            {user ? (<>
              <button style={{fontSize: '0.7em', padding: '0.5em 0', display: 'block', width: '100%'}} type="button" onClick={() => Meteor.logout()}>Sign out</button>
            </>) : []}

          </ul>
        {content}
      </div>
    </RuntimeContext.Provider>
  );

};
