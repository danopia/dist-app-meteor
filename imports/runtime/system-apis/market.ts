import { stripIndent } from "common-tags";

import { FetchRpcHandler } from "/imports/runtime/FetchRpcHandler";
import { StaticCatalogs } from "/imports/engine/StaticCatalogs";

import { ApplicationEntity, IconSpec } from "/imports/entities/manifest";
import { AppInstallationEntity } from "/imports/entities/profile";
import { FetchRequestEntity, FetchResponseEntity } from "/imports/entities/protocol";
import { ArbitraryEntity } from "/imports/entities/core";

/**
 * # market.v1alpha1.dist.app
 *
 * This API is used by:
 *   - market (bundled app)
 *       This API provides the network and runtime access
 *       to explore the available applications and any existing installations.
 */
export async function serveMarketApi(rpc: {
  request: FetchRequestEntity['spec'],
  path: string,
  context: FetchRpcHandler,
}): Promise<FetchResponseEntity['spec']> {
  console.log('MARKET API:', rpc);

  if (rpc.path == 'list-available-apps' && rpc.request.method == 'GET') {

    // // Find the applications which are already available
    // const applications = rpc.context.runtime.findAllEntities<ApplicationEntity>(
    //   'manifest.dist.app/v1alpha1', 'Application');

    // Find applications which we could access if desired
    let listings = rpc.context.runtime.findAllEntities<AppListingEntity>(
      'market.dist.app/v1alpha1', 'AppListing');
    if (listings.length == 0) {
      // TODO: better way of waiting until we have the app listings downloaded
      await new Promise(ok => setTimeout(ok, 2000));
      listings = rpc.context.runtime.findAllEntities<AppListingEntity>(
        'market.dist.app/v1alpha1', 'AppListing');
    }

    // Find the user's app installations
    const installations = rpc.context.runtime.findAllEntities<AppInstallationEntity>(
      'profile.dist.app/v1alpha1', 'AppInstallation');

    // const bundledApps = Array.from(StaticCatalogs.entries()).map(([id, catalog]) => {
    //   const appRes = catalog.flatMap(x => x.kind == 'Application' ? [x] : [])[0];
    //   return {
    //     id: 'bundled:'+id.slice(4),
    //     url: `entity://bundled/manifest.dist.app/v1alpha1/Application/${encodeURIComponent(id)}`,
    //     appUri: 'bundled:'+encodeURIComponent(id),
    //     appRes,
    //   };
    // });

    // const discoveredApps = applications.map(({ns, entity: appRes}) => {
    //   return {
    //     id: 'bundled:'+ns.slice(4),
    //     url: `entity://bundled/manifest.dist.app/v1alpha1/Application/${encodeURIComponent(ns)}`,
    //     appUri: 'bundled:'+encodeURIComponent(ns),
    //     appRes,
    //   };
    // });

    const listedApps = listings.map(({ns, entity: appRes}) => {
      return {
        id: appRes.metadata.uid,
        appDataUrl: `ddp-catalog://dist-v1alpha1.deno.dev/${encodeURIComponent(appRes.spec.developmentDistUrl!.split(':')[1])}`,
        url: `entity://${ns}/${appRes.apiVersion}/${appRes.kind}/${encodeURIComponent(appRes.metadata.name)}`,
        // appUri: 'dist-registry:'+encodeURIComponent(appRes.spec.developmentDistUrl ?? ''),
        appRes,
      };
    });

    // const seenAppUrls = new Set<string>(bundledApps.map(x => x.url));
    const allApps = [
      // ...bundledApps,
      // ...discoveredApps.filter(x => !seenAppUrls.has(x.url)),
      ...listedApps,
    ]
      .sort((a,b) => a.appRes.metadata.title?.localeCompare(b.appRes.metadata.title ?? '') ?? 1)
      .map(appInfo => {
        // Know where the app is already present
        const appInstalls = installations.filter(x => {
          return appInfo.appDataUrl == x.entity.spec.appUri;
        });

        return {
          id: appInfo.id,
          url: appInfo.url,
          appDataUrl: appInfo.appDataUrl,
          title: appInfo.appRes.metadata.title ?? 'N/A',
          description: appInfo.appRes.metadata.description ?? 'N/A',
          iconUrl: brandImageUrlForApp(appInfo.appRes),
          status: appInstalls.length > 0 ? 'Installed' : 'Available',
          currentInstallations: appInstalls.map(x => ({
            profileNamespace: x.ns,
            appInstallName: x.entity.metadata.name,
          })),
        };
      });

    return {
      status: 200,
      headers: [
        ['content-type', 'application/json'],
      ],
      // bodyStream: (async function*() {
      //   return '';
      // }),
      body: JSON.stringify({
        profiles: [{
          namespace: 'session',
          title: 'Current user account',
        }],
        listings: allApps,
      }),
    };
  }

  return {
    status: 201,
    body: 'ok',
  };
}

function brandImageUrlForApp(appRes: {spec: {brandImageUrl?: string; icon?: IconSpec}}) {
  if (appRes.spec.brandImageUrl) return appRes.spec.brandImageUrl;
  if (appRes.spec.icon) return brandImageUrlForIcon(appRes.spec.icon);
  return null;
}

function brandImageUrlForIcon(icon: IconSpec) {
  switch (icon.type) {
    case 'glyph': {
      return `data:image/svg+xml,${encodeURIComponent(stripIndent`
        <svg width="800" height="600" version="1.1" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="30" r="25" fill="${icon.glyph.backgroundColor}" />
          <text x="40" y="1.5em" font-size="25" text-anchor="middle">${icon.glyph.text}</text>
        </svg>`)}`;
    }
    case 'svg': {
      return `data:image/svg+xml,${encodeURIComponent(stripIndent`
        <svg width="800" height="600" version="1.1" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="30" r="25" fill="${icon.svg.backgroundColor}" />
          <image x="25" y="15" width="30" height="30" href="data:image/svg+xml,${encodeURIComponent(icon.svg.textData)}" />
        </svg>`)}`
    }
    default: {
      return null;
    }
  }
}


export interface AppListingEntity extends ArbitraryEntity {
  apiVersion: 'market.dist.app/v1alpha1';
  kind: 'AppListing';
  spec: {
    icon?: IconSpec;
    brandImageUrl?: string;
    developmentDistUrl?: string;
  };
  status?: {
    latestRelease?: string;
    releaseHistory: Array<{
      publishedAt: Date;
      releaseName: string;
    }>;
  };
};
