import React, { useCallback, useState } from 'react';
import { useTracker } from "meteor/react-meteor-data";

import { AppIcon } from "/imports/ui/widgets/AppIcon";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { EntityHandle } from "/imports/engine/EntityHandle";
import { ApiBindingEntity, ApplicationEntity, CatalogBindingEntity } from "/imports/entities/manifest";
import { AppInstallationEntity } from "/imports/entities/profile";
import { CommandEntity, FrameEntity, WorkspaceEntity } from "/imports/entities/runtime";
import { AppListingEntity } from "/imports/runtime/system-apis/market";
import { deleteFrame } from "/imports/runtime/workspace-actions";
import { marketUrl } from "/imports/settings";

export function InstallAppFromListing(props: {
  runtime: EntityEngine;
  hWorkspace: EntityHandle<WorkspaceEntity>;
  hAppListing: EntityHandle<AppListingEntity>;
  targetNamespace: string;
  command: CommandEntity;
  cmdFrame: FrameEntity;
}) {
  const { runtime } = props;

  // Reactively fetch several key app entities
  const appListing = useTracker(() => props.hAppListing.get(), [props.hAppListing]);
  const entities = useTracker(() => {
    if (!appListing) return {};
    const appDataUrl = `ddp-catalog://${marketUrl.split('/')[2]}/${encodeURIComponent(appListing.spec.developmentDistUrl!.split(':')[1])}`;
    const appNs = runtime.useRemoteNamespace(appDataUrl);
    return {
      appDataUrl,
      app: runtime.listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application', appNs)[0],
      apiBindings: runtime.listEntities<ApiBindingEntity>('manifest.dist.app/v1alpha1', 'ApiBinding', appNs),
      catBindings: runtime.listEntities<CatalogBindingEntity>('manifest.dist.app/v1alpha1', 'CatalogBinding', appNs),
    };
  }, [marketUrl, appListing]);

  type AppBindingSpec = Exclude<AppInstallationEntity['spec']['catalogBindings'], undefined>[number]['binding'];
  const [bindingSources, setBindingSources] = useState<Record<string, AppBindingSpec>>(() => Object
    .fromEntries(entities.catBindings?.map<[string,AppBindingSpec]>(request => {
      if (request.spec.catalogType.type == 'SpecificApi') {
        return [request.metadata.name, {
          type: 'InMemory',
        }];
      }
      throw new Error(`unimpl`);
    }) ?? []));
  console.log('bindingSources:', JSON.stringify(bindingSources, null, 2))

  const doInstall = useCallback(async () => {
    if (!appListing) throw new Error(`BUG: never`);
    if (!entities.appDataUrl) throw new Error(`BUG: never`);

    await runtime.insertEntity<AppInstallationEntity>({
      apiVersion: 'profile.dist.app/v1alpha1',
      kind: 'AppInstallation',
      metadata: {
        name: `app-${appListing.metadata.name}`,
        title: appListing.metadata.title,
        namespace: props.targetNamespace,
      },
      spec: {
        appUri: entities.appDataUrl,
        launcherIcons: [{
          action: 'app.dist.Main',
        }],
        preferences: {},
        catalogBindings: Object.entries(bindingSources).map(x => ({
          name: x[0],
          binding: x[1],
        })),
      },
    });

    // TODO: this cleanup shall be done by deleteFrame
    await runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
    await deleteFrame(props.hWorkspace, props.cmdFrame.metadata.name);
  }, [
    runtime,
    appListing,
    props.targetNamespace,
    entities.appDataUrl,
  ]);

  // Wait for the data to show up
  if (!appListing) return (
    <div className="activity-contents-wrap">No AppListing yet...</div>
  );
  if (!entities.app) return (
    <div className="activity-contents-wrap">No Application yet...</div>
  );

  return (<div className="activity-contents-wrap"
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5em',
      margin: '1em',
      alignItems: 'center',
    }}>

    You are about to install:
    <AppIcon sizeRatio={3} iconSpec={appListing.spec.icon ?? null}  />
    <h2 style={{margin: 0}}>{appListing.metadata.title}</h2>
    <h4 style={{margin: 0}}>https://{marketUrl.split('/')[2]}</h4>
    <p style={{margin: 0}}>This application will have access to:</p>
    <h4 style={{margin: 0}}>TODO</h4>
    {entities.catBindings.map(binding => (
      <p key={binding.metadata.uid} style={{margin: 0}}>
        {binding.metadata.name}{":  "}
        <select onChange={evt => {
          if (evt.target.value == 'in-memory') {
            setBindingSources({
              ...bindingSources,
              [binding.metadata.name]: {
                type: 'InMemory',
              },
            });
          }
        }}>
          <option value="in-memory">In Memory</option>
        </select>
      </p>
    ))}
    {entities.apiBindings.map(binding => (
      <p key={binding.metadata.uid} style={{margin: 0}}>
        {binding.metadata.name}{":  "}
        API
      </p>
    ))}
    <button onClick={doInstall}>Install development version</button>
  </div>);
}
