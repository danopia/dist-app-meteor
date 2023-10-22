import { useTracker } from 'meteor/react-meteor-data';
import React, { useEffect, useMemo, useRef } from 'react';

import { ActivityShell } from '/imports/ui/ActivityShell';
import { EntityEngine } from '/imports/engine/EntityEngine';
import { AppInstallationEntity } from '/imports/entities/profile';
import { WorkspaceEntity } from '/imports/entities/runtime';
import { marketUrl } from '/imports/settings';
import { RuntimeContext } from '/imports/ui/contexts';
import { FramesPanel } from '/imports/ui/tray/FramesPanel';
import { AppListingEntity } from '/imports/runtime/system-apis/market';
import { launchNewIntent } from '/imports/runtime/workspace-actions';
import { ConnectionsPanel } from '/imports/ui/tray/ConnectionsPanel';
import { LogoutPanel } from '/imports/ui/tray/LogoutPanel';
import { BrandingPanel } from '/imports/ui/tray/BrandingPanel';
import { CatalogBindingEntity } from '/imports/entities/manifest';
import { MeteorEntityStorage } from '/imports/engine/EntityStorage';
import { MonitoringPanel } from '../tray/MonitoringPanel';
import { CommandPanel } from '../tray/CommandPanel';

export const LaunchPublicApp = (props: {
  appListingName: string;
}) => {

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

  // // For debugging purposes, also open an Explorer:
  // const explorerSetup = useRef<typeof hWorkspace | null>(null);
  // useEffect(() => {
  //   if (explorerSetup.current == hWorkspace) return;
  //   explorerSetup.current = hWorkspace;
  //   launchNewIntent(hWorkspace, {
  //     receiverRef: `internal://explorer`,
  //     action: 'app.dist.Main',
  //     category: 'app.dist.Launcher',
  //   }, 'default-explorer');
  // }, [hWorkspace, explorerSetup]);

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
    const appNamespace = engine.useRemoteNamespace(appDataUrl);

    (async () => {
      // TODO: use app.dist.InstallApp to install the application, once it can finish unattended.

      // Wait for the application's source to be loaded
      const appLayer = engine.selectNamespaceLayer({
        apiVersion: 'manifest.dist.app/v1alpha1',
        kind: 'Application',
        namespace: appNamespace,
        op: 'Read',
      });
      if (!appLayer) throw new Error(`no appLayer`);
      if (appLayer.impl instanceof MeteorEntityStorage) {
        if (appLayer.impl.subscription) {
          console.log('waiting for sub');
          while (!appLayer.impl.subscription.ready()) {
            await new Promise(ok => setTimeout(ok, 250));
          }
          console.log('waited for sub');
        }
      }

      const catalogBindings = engine.listEntities<CatalogBindingEntity>(
        'manifest.dist.app/v1alpha1', 'CatalogBinding',
        appNamespace);

      await engine.insertEntity<AppInstallationEntity>({
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
          catalogBindings: catalogBindings?.map(request => {
            if (request.spec.catalogType.type == 'SpecificApi') {
              return {
                name: request.metadata.name,
                binding: {
                  type: 'InMemory',
                },
              };
            }
            throw new Error(`unimpl`);
          }) ?? [],
        },
      });

      await launchNewIntent(hWorkspace, {
        receiverRef: `entity://login/profile.dist.app/v1alpha1/AppInstallation/primary`,
        action: 'app.dist.Main',
        category: 'app.dist.Launcher',
      }, 'default-app');
    })();

  }, [appSetup, engine, appListing]);

  const workspace = useTracker(() => hWorkspace.get(), [hWorkspace]);
  if (!workspace) {
    return (
      <div className="switcher-content">
        <div>no workspace...</div>
      </div>
    );
  }

  return (
    <RuntimeContext.Provider value={engine}>
      <div className="switcher-root">

        <ul className="switcher-menu">
          <BrandingPanel iconSpec={appListing?.spec.icon} />
          <CommandPanel hWorkspace={hWorkspace} />
          <FramesPanel hWorkspace={hWorkspace} />
          <div style={{flex: 1}} />
          <MonitoringPanel />
          <ConnectionsPanel />
          <LogoutPanel />
        </ul>

        <div className="switcher-content activity-shell-parent">
          <ActivityShell guest={true} workspaceName='primary' />
        </div>

      </div>
    </RuntimeContext.Provider>
  );

};
