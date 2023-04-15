import { stripIndent } from "common-tags";

import { FetchRpcHandler } from "/imports/runtime/FetchRpcHandler";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { StaticCatalogs } from "/imports/engine/StaticCatalogs";

import { ArbitraryEntity } from "/imports/entities/core";
import { ApplicationEntity, IconSpec } from "/imports/entities/manifest";
import { AppInstallationEntity } from "/imports/entities/profile";
import { FetchRequestEntity, FetchResponseEntity } from "/imports/entities/protocol";

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

    // Find the user's available applications
    const applications = findAllEntities<ApplicationEntity>(rpc.context.runtime,
      'manifest.dist.app/v1alpha1', 'Application');

    // Find the user's app installations
    const installations = findAllEntities<AppInstallationEntity>(rpc.context.runtime,
      'profile.dist.app/v1alpha1', 'AppInstallation');


    const bundledApps = Array.from(StaticCatalogs.entries()).map(([id, catalog]) => {
      const appRes: ApplicationEntity | undefined = catalog.flatMap(x => x.kind == 'Application' ? [x] : [])[0];
      return {
        id: 'bundled:'+id.slice(4),
        url: `entity://bundled/manifest.dist.app@v1alpha1/Application/${encodeURIComponent(id)}`,
        appUri: 'bundled:'+encodeURIComponent(id),
        appRes,
      };
    });

    const discoveredApps = applications.map(({ns, entity: appRes}) => {
      return {
        id: 'bundled:'+ns.slice(4),
        url: `entity://bundled/manifest.dist.app@v1alpha1/Application/${encodeURIComponent(ns)}`,
        appUri: 'bundled:'+encodeURIComponent(ns),
        appRes,
      };
    });

    const seenAppUrls = new Set<string>(bundledApps.map(x => x.url));
    const allApps = [
      ...bundledApps,
      ...discoveredApps.filter(x => !seenAppUrls.has(x.url)),
    ]
      .map(appInfo => {
        // Know where the app is already present
        const appInstalls = installations.filter(x => {
          return x.entity.spec.appUri == appInfo.appUri;
        });

        return {
          id: appInfo.id,
          url: appInfo.url,
          title: appInfo.appRes.metadata.title ?? 'N/A',
          description: appInfo.appRes.metadata.description ?? 'N/A',
          iconUrl: brandImageUrlForApp(appInfo.appRes),
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
          namespace: 'profile:user',
          title: 'Current user account',
        }, {
          namespace: 'profile:guest',
          title: 'Guest session',
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

function brandImageUrlForApp(appRes: ApplicationEntity) {
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

// TODO: move a shared file
function findAllEntities<T extends ArbitraryEntity>(
  runtime: EntityEngine,
  apiVersion: T["apiVersion"],
  kind: T["kind"],
) {
  // Find places where we can find the type of entity
  const namespaces = Array
    .from(runtime
      .getNamespacesServingApi({
        apiVersion, kind,
        op: 'Read',
      })
      .keys());

  // Collect all of the entities
  return namespaces
    .flatMap(x => runtime
      .listEntities<T>(apiVersion, kind, x)
      .map(entity => ({ ns: x, entity })));
}
