import { stripIndent } from "common-tags";
import { FetchRpcHandler } from "../FetchRpcHandler";
import { StaticCatalogs } from "/imports/engine/StaticCatalogs";
import { ApplicationEntity } from "/imports/entities/manifest";
import { AppInstallationEntity } from "/imports/entities/profile";
import { FetchRequestEntity, FetchResponseEntity } from "/imports/entities/protocol";

/**
 * # session.v1alpha1.dist.app
 *
 * This API is used by:
 *   - market (bundled app)
 *       This API provides the network and runtime access
 *       to explore the available applications and any existing installations.
 */
export async function serveMarketApi(rpc: {request: FetchRequestEntity['spec'], path: string, context: FetchRpcHandler }): Promise<FetchResponseEntity['spec']> {
  console.log('MARKET:', rpc);

  if (rpc.path == 'list-available-apps' && rpc.request.method == 'GET') {

    // Find places where we can find the user's existing installations
    const namespaces = Array
      .from(rpc.context.runtime
        .getNamespacesServingApi({
          apiVersion: 'profile.dist.app/v1alpha1',
          kind: 'AppInstallation',
          op: 'Read',
        })
        .keys());
    console.log({ namespaces });

    // Find existing installations
    const installations = namespaces
      .flatMap(x => rpc.context.runtime
        .listEntities<AppInstallationEntity>(
          'profile.dist.app/v1alpha1', 'AppInstallation', x)
        .map(entity => ({ ns: x, entity })));

    const bundledApps = Array.from(StaticCatalogs.entries()).map(([id, catalog]) => {
      const appRes: ApplicationEntity | undefined = catalog.flatMap(x => x.kind == 'Application' ? [x] : [])[0];

      // Know where the app is already present
      const appInstalls = installations.filter(x => {
        return x.entity.spec.appUri == 'bundled:'+encodeURIComponent(id);
      });

      return {
        id: 'bundled:'+id.slice(4),
        // url: 'bundled:'+encodeURIComponent(id),
        url: `entity://bundled/manifest.dist.app@v1alpha1/Application/${encodeURIComponent(id)}`,
        title: appRes.metadata.title ?? 'N/A',
        description: appRes.metadata.description ?? 'N/A',
        iconUrl: appRes.spec.brandImageUrl ?? (appRes.spec.icon?.type == 'glyph'
        ? `data:image/svg+xml,${encodeURIComponent(stripIndent`
            <svg width="800" height="600" version="1.1" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="30" r="25" fill="${appRes.spec.icon.glyph.backgroundColor}" />
              <text x="40" y="1.5em" font-size="25" text-anchor="middle">${appRes.spec.icon.glyph.text}</text>
            </svg>`)}`
        : appRes.spec.icon?.type == 'svg'
        ? `data:image/svg+xml,${encodeURIComponent(stripIndent`
            <svg width="800" height="600" version="1.1" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="30" r="25" fill="${appRes.spec.icon.svg.backgroundColor}" />
              <image x="25" y="15" width="30" height="30" href="data:image/svg+xml,${encodeURIComponent(appRes.spec.icon.svg.textData)}" />
            </svg>`)}`
        : null),
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
      // bodyStrea: (async function*() {
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
        listings: [
          ...bundledApps,
          // TODO: other app sources
        ],
      }),
    };
  }

  return {
    status: 201,
    body: 'ok',
  };
}
