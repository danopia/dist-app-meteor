import { Meteor } from "meteor/meteor";
import { EntityHandle } from "../engine/EntityHandle";
import { ReactiveMap } from "../lib/reactive-map";
import { startHttpClientOperator } from "./system-controllers/http-client";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { CatalogBindingEntity } from "/imports/entities/manifest";
import { AppInstallationEntity, EntityCatalogEntity } from "/imports/entities/profile";
import { AsyncKeyedCache } from "/imports/runtime/async-cache";
import { startManifestRuntimeOperator } from "./system-controllers/manifest-runtime";

export const allAppEngines = new ReactiveMap<string,EntityEngine>();

const appEngineCache = new AsyncKeyedCache({
  keyFunc: (x: EntityHandle<AppInstallationEntity>) => `${x.coords.namespace}/${x.coords.name}`,
  loadFunc: async (hAppInstallation, key) => {

    const appInstallation = hAppInstallation.get();
    if (!appInstallation) throw new Error(`no appinstallation found`);

    const engine = new EntityEngine();
    const appNamespace = engine.useRemoteNamespace(appInstallation.spec.appUri, 'src');

    for (const { name, binding } of appInstallation.spec.catalogBindings ?? []) {

      const catalogBinding = engine.getEntity<CatalogBindingEntity>(
        'manifest.dist.app/v1alpha1', 'CatalogBinding',
        appNamespace, name);
      if (!catalogBinding) throw new Meteor.Error('todo',
        `no catalogBinding found for ${name}`);
      if (catalogBinding.spec.catalogType.type !== 'SpecificApi') throw new Meteor.Error('todo',
        `Other catalogTypes`);

      switch (binding.type) {
        case 'InMemory': {

          engine.addNamespace({
            name: catalogBinding.spec.targetNamespace,
            spec: {
              layers: [{
                mode: 'ReadWrite',
                accept: [{
                  apiGroup: catalogBinding.spec.catalogType.specificApi.group,
                }],
                storage: {
                  type: 'local-inmemory',
                },
              }],
            },
          });

        } break;

        case 'ProfileCatalog': {
          const entityCatalog = hAppInstallation.getNeighborHandle<EntityCatalogEntity>(
            'profile.dist.app/v1alpha1', 'EntityCatalog',
            binding.name).get();
          if (!entityCatalog) throw new Meteor.Error('todo',
            `no EntityCatalog found for ${binding.name}`);

          if (!entityCatalog.status?.catalogId) throw new Meteor.Error('todo',
            `The EntityCatalog ${entityCatalog.metadata.name} is not ready yet.`);

          engine.addNamespace({
            name: catalogBinding.spec.targetNamespace,
            spec: {
              layers: [{
                mode: 'ReadWrite',
                accept: [{
                  apiGroup: catalogBinding.spec.catalogType.specificApi.group,
                }],
                storage: {
                  type: 'primary-ddp',
                  catalogId: entityCatalog.status.catalogId,
                },
              }],
            },
          });

        } break;

        default: throw new Meteor.Error(`bug`,
          `Unexpected entity type`);
      }

      // TODO: something better about this
      if (catalogBinding.spec.catalogType.specificApi.group == 'http-client.dist.app') {
        await startHttpClientOperator({
          engine: engine,
          namespace: catalogBinding.spec.targetNamespace,
          signal: new AbortController().signal,
        });
      }

    }

    // entity://dynamic/manifest-runtime.dist.app/v1alpha1/rest-connections/by-name/google-dns
    engine.addNamespace({
      name: 'dynamic',
      spec: {
        layers: [{
          mode: 'ReadWrite',
          accept: [{
            apiGroup: 'manifest-runtime.dist.app',
          }],
          storage: {
            type: 'local-inmemory',
          },
        }],
      },
    });
    await startManifestRuntimeOperator({
      engine: engine,
      namespace: 'dynamic',
      signal: new AbortController().signal,
    });

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
