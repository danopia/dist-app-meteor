import { EntityHandle } from "../engine/EntityHandle";
import { ReactiveMap } from "../lib/reactive-map";
import { startHttpClientOperator } from "./system-controllers/http-client";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { CatalogBindingEntity } from "/imports/entities/manifest";
import { AppInstallationEntity, EntityCatalogEntity } from "/imports/entities/profile";
import { AsyncKeyedCache } from "/imports/runtime/async-cache";

export const allAppEngines = new ReactiveMap<string,EntityEngine>();

const appEngineCache = new AsyncKeyedCache({
  keyFunc: (x: EntityHandle<AppInstallationEntity>) => `${x.coords.namespace}/${x.coords.name}`,
  loadFunc: async (x, key) => {

    const appInstallation = x.get();
    if (!appInstallation) throw new Error(`no appinstallation found`);

    const engine = new EntityEngine();
    const appNamespace = engine.useRemoteNamespace(appInstallation.spec.appUri);

    const catalogBindings = engine.listEntities<CatalogBindingEntity>(
      'manifest.dist.app/v1alpha1', 'CatalogBinding',
      appNamespace);
    for (const catalogBinding of catalogBindings) {
      
      if (catalogBinding.spec.catalogType.type !== 'SpecificApi') continue;
      const catType = catalogBinding.spec.catalogType;

      const entityCatalogs = x.listNeighbors<EntityCatalogEntity>(
        'profile.dist.app/v1alpha1', 'EntityCatalog');

      // console.log('Found', {catalogBinding, entityCatalogs});

      const matchingCatalog = entityCatalogs.find(x => {
        if (x.entity.spec.apiGroup !== catType.specificApi.group) return;
        // TODO: more access control checks
        return true;
      })

      if (!matchingCatalog) {
        console.error(`WARN: no catalog matched.`, {catalogBinding, entityCatalogs});
        continue;
      }

      // if (matchingCatalog?.entity.status?.catalogId)

      engine.addNamespace({
        name: catalogBinding.spec.targetNamespace,
        spec: {
          layers: [{
            mode: 'ReadWrite',
            accept: [{
              apiGroup: matchingCatalog?.entity.spec.apiGroup,
            }],
            storage: {
              // TODO: other types
              type: 'local-inmemory',
            },
          }],
        },
      });

      if (matchingCatalog?.entity.spec.apiGroup == 'http-client.dist.app') {
        await startHttpClientOperator({
          engine: engine,
          namespace: catalogBinding.spec.targetNamespace,
          signal: new AbortController().signal,
        });
      }

      // await engine.insertEntity<EntityCatalogEntity>({
      //   apiVersion: 'profile.dist.app/v1alpha1',
      //   kind: 'EntityCatalog',
      //   metadata: {
      //     name: catalogBinding.metadata.name,
      //     namespace: 'login',
      //   },
      //   spec: {
      //     apiGroup: catalogBinding.spec.catalogType.specificApi.group,
      //     appUri: appDataUrl, // TODO: referencing APIs from other bundles?
      //   },
      // });
    }

    allAppEngines.set(key, engine);
    return engine;
  },
});

export async function getAppInstallationEngine(hAppInstallation: EntityHandle<AppInstallationEntity>) {

  return await appEngineCache.get(hAppInstallation);

}


      // // Wait for the application's source to be loaded
      // const appLayer = engine.selectNamespaceLayer({
      //   apiVersion: 'manifest.dist.app/v1alpha1',
      //   kind: 'Application',
      //   namespace: appNamespace,
      //   op: 'Read',
      // });
      // if (!appLayer) throw new Error(`no appLayer`);
      // if (appLayer.impl instanceof MeteorEntityStorage) {
      //   if (appLayer.impl.subscription) {
      //     console.log('waiting for sub');
      //     while (!appLayer.impl.subscription.ready()) {
      //       await new Promise(ok => setTimeout(ok, 250));
      //     }
      //     console.log('waited for sub');
      //   }
      // }
