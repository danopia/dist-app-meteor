import { ActivityEntity } from "../entities/manifest";
import { WorkspaceEntity } from "../entities/runtime";
import { EntityEngine } from "./EntityEngine";
import { StaticCatalogs } from "./StaticCatalogs";

export class EngineFactory {

  static forGuestSession() {
    const engine = new EntityEngine();

    engine.addNamespace({
      name: 'default',
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
      }});

    for (const defaultNamespace of StaticCatalogs.keys()) {
      if (!defaultNamespace.startsWith('app:')) continue;
      engine.addNamespace({
        name: defaultNamespace,
        spec: {
          layers: [{
            mode: 'ReadOnly',
            accept: [{
              apiGroup: 'manifest.dist.app',
            }],
            storage: {
              type: 'bundled',
              bundleId: defaultNamespace,
            },
          }],
          // namespace: defaultNamespace,
          // remote: {
          //   type: 'static-catalog',
          // },
        }});
      // engine.insertEntity<ForeignNamespaceEntity>({
      //   apiVersion: 'runtime.dist.app/v1alpha1',
      //   kind: 'ForeignNamespace',
      //   metadata: {
      //     namespace: 'default',
      //     name: defaultNamespace,
      //   },
      //   spec: {
      //     namespace: defaultNamespace,
      //     remote: {
      //       type: 'static-catalog',
      //     },
      //   }});
    }

        // }, {
    // engine.addNamespace({
    //   name: 'system_apps',
    //   spec: {
    //     layers: [{
    //       mode: 'ReadOnly',
    //       accept: [{
    //         apiGroup: 'manifest.dist.app',
    //       }],
    //       storage: {
    //         type: 'bundled',
    //         bundleId: 'system:bundled-apps'
    //       },
    //     }],
    //   }});

    // const workspaceName = Random.id();
    engine.insertEntity<WorkspaceEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Workspace',
      metadata: {
        name: 'main',
        namespace: 'default',
      },
      spec: {
        windowOrder: [],
      },
    });
    const shell = engine.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'default', 'main');
    if (!shell) throw new Error(`no shell`);

    // const staticCatalog = engine.loadEntity('runtime.dist.app/v1alpha1', 'ForeignNamespace', 'default', 'app:welcome');

    const welcomeAct = engine.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', 'app:welcome', 'main');
    console.log(welcomeAct)
    if (!welcomeAct) throw new Error(`no welcome act`);

    shell.createTask(welcomeAct);

    return engine;
  }
}
