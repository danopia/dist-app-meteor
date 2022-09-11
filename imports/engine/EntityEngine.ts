import { ArbitraryEntity, NamespaceEntity } from "../entities/core";
import { AsyncCache, AsyncKeyedCache } from "../runtime/async-cache";
import { ShellSession } from "../runtime/ShellSession";
import { MongoEntityStorage, StaticEntityStorage } from "./EntityStorage";
import { LayeredNamespace } from "./next-gen";

// type ApiFilter<T extends ArbitraryEntity> = {
//   apiVersion: T["apiVersion"];
//   kind: T["kind"];
//   namespace?: string;
//   op: 'Read' | 'Write';
// };

function loadFunc(this: EntityEngine, input: ArbitraryEntity, key: string) {
  if (input.apiVersion == 'runtime.dist.app/v1alpha1') {
    // if (input.kind == 'ForeignNamespace') {
    //   // return new
    // }
    if (input.kind == 'Workspace') {
      return new ShellSession(this, input.metadata.namespace ?? 'bug', input.metadata.name);
    }
    if (input.kind == 'Activity') {
      throw new Error(`TODO: activity class`)
    }
  }
  throw new Error('TODO: loadFunc for '+key);
}

export class EntityEngine {
  constructor(
    // primaryCatalog
  ) { }

  namespaces = new Map<string, LayeredNamespace>();
  loadedMap = new Map<string, ShellSession>();
  // loader = new AsyncKeyedCache<ArbitraryEntity, string, | ShellSession>({
  //   keyFunc: x => [x.metadata.namespace, x.apiVersion, x.kind, x.metadata.name].join('_'),
  //   loadFunc: async (input, key) => {
  //     if (input.apiVersion == 'runtime.dist.app/v1alpha1') {
  //       if (input.kind == 'ForeignNamespace') {
  //         // return new
  //       }
  //       if (input.kind == 'Workspace') {
  //         return new ShellSession(this, input.metadata.namespace ?? 'bug', input.metadata.name);
  //       }
  //     }
  //     throw new Error('TODO: loadFunc for '+key);
  //   },
  // })

  addNamespace(opts: {
    name: string;
    spec: NamespaceEntity["spec"];
  }) {
    if (this.namespaces.has(opts.name)) {
      throw new Error(`namespace already exists`);
    }
    this.namespaces.set(opts.name, new LayeredNamespace(opts.name, opts.spec));
  }

  // getNamespacedApi<T extends ArbitraryEntity>(opts: {
  //   namespace: string;
  //   apiVersion: T["apiVersion"];
  // }) {
  //   throw new Error('Method not implemented.');
  // }
  listNamespaces<T extends ArbitraryEntity>(props: {
    apiVersion: T["apiVersion"];
    kind: T["kind"];
    op: 'Read' | 'Write';
  }) {
    return Array.from(this.namespaces).filter(x => x[1].selectLayer({
      op: props.op,
      apiGroup: props.apiVersion.split('/')[0],
      apiVersion: props.apiVersion.split('/')[1],
      kind: props.kind,
    })).map(x => x[0]);
  }

  selectNamespaceLayer<T extends ArbitraryEntity>(props: {
    apiVersion: T["apiVersion"];
    kind: T["kind"];
    namespace?: string;
    op: 'Read' | 'Write';
  }) {
    const nsName = props.namespace ?? 'default';
    const ns = this.namespaces.get(nsName);
    if (!ns)
      throw new Error(
        `No namespace found for ${nsName}`);

    const layer = ns?.selectLayer({
      op: props.op,
      apiGroup: props.apiVersion.split('/')[0],
      apiVersion: props.apiVersion.split('/')[1],
      kind: props.kind,
    });
    if (!layer)
      throw new Error(
        `No ${nsName} layer wants to ${props.op} ${props.kind}.${props.apiVersion}`);

    return layer;
  }


  *iterateNamespacesServingApi(props: {
    apiVersion: string;
    kind: string;
    op: 'Read' | 'Write';
  }): Generator<[string, MongoEntityStorage | StaticEntityStorage]> {
    for (const [name, ns] of this.namespaces) {
      const layer = ns.selectLayer({
        op: props.op,
        apiGroup: props.apiVersion.split('/')[0],
        apiVersion: props.apiVersion.split('/')[1],
        kind: props.kind,
      });
      if (layer) {
        yield [name, layer.impl];
      }
    }
  }

  getNamespacesServingApi(props: {
    apiVersion: string;
    kind: string;
    op: 'Read' | 'Write';
  }) {
    return new Map(this.iterateNamespacesServingApi(props));
  }


  insertEntity<T extends ArbitraryEntity>(entity: T) {
    const layer = this.selectNamespaceLayer({
      apiVersion: entity.apiVersion,
      kind: entity.kind,
      namespace: entity.metadata.namespace,
      op: 'Write',
    });
    return layer?.impl.insertEntity<T>(entity);
  }

  listEntities<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace?: string
  ): T[] {
    const layer = this.selectNamespaceLayer({
      apiVersion: apiVersion,
      kind: kind,
      namespace: namespace,
      op: 'Read',
    });
    return layer.impl.listEntities<T>(apiVersion, kind).map(entity => {
      return {...entity, metadata: {...entity.metadata, namespace: namespace ?? 'default'}};
    });
  }

  getEntity<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace: string | undefined,
    name: string
  ): T | null {
    const layer = this.selectNamespaceLayer({
      apiVersion: apiVersion,
      kind: kind,
      namespace: namespace,
      op: 'Read',
    });
    if (!layer) return null;
    const entity = layer.impl.getEntity(apiVersion, kind, name)
    if (!entity) return null;
    return {...entity, metadata: {...entity.metadata, namespace: namespace ?? 'default'}};
  }

  loadEntity<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace: string | undefined,
    name: string
  ) {
    const key = [namespace, apiVersion, kind, name].join('_');
    let exists = this.loadedMap.get(key);
    if (!exists) {
      const entity = this.getEntity(apiVersion, kind, namespace, name);
      if (!entity) return null;
      exists = loadFunc.call(this, entity, key);
      this.loadedMap.set(key, exists);
    }
    return exists;
    // return await this.loader.get(entity);
  }

  updateEntity<T extends ArbitraryEntity>(newEntity: T) {
    const layer = this.selectNamespaceLayer({
      apiVersion: newEntity.apiVersion,
      kind: newEntity.kind,
      namespace: newEntity.metadata.namespace,
      op: 'Write',
    });

    const count = layer.impl.updateEntity(newEntity);
    if (!count)
      throw new Error(`TODO: Update applied to zero entities`);
  }

  // Mutation helper
  mutateEntity<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace: string | undefined,
    name: string, mutationCb: (x: T) => void | Symbol
  ) {
    const layer = this.selectNamespaceLayer({
      apiVersion, kind,
      namespace,
      op: 'Write',
    });

    const entity = layer.impl.getEntity(apiVersion, kind, name);
    if (!entity)
      throw new Error(`Entity doesn't exist`);

    const result = mutationCb(entity);
    if (result == Symbol.for('no-op'))
      return;

    layer.impl.updateEntity(entity);
  }

  deleteEntity<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace: string | undefined,
    name: string
  ) {
    const layer = this.selectNamespaceLayer({
      apiVersion, kind,
      namespace,
      op: 'Write',
    });
    return layer.impl.deleteEntity(apiVersion, kind, name);
  }



  useRemoteNamespace(appUri: string) {
    // const [loadedNs, setLoadedNs] = useState<string|false>(false);

    // TODO: this sucks!
    const nsName = encodeURIComponent(appUri);

    if (this.namespaces.has(nsName)) return nsName;

    const appUrl = new URL(appUri);

    if (appUrl.protocol == 'bundled:') {
      const bundledName = decodeURIComponent(appUrl.pathname);
      this.addNamespace({
        name: nsName,
        spec: {
          layers: [{
            mode: 'ReadOnly',
            accept: [{
              apiGroup: 'manifest.dist.app',
            }],
            storage: {
              type: 'bundled',
              bundleId: bundledName,
            },
          }],
        }});
      return nsName;
    }
    // console.log('p', appUrl.protocol)

    throw new Error("Function not implemented.");
  }
}
