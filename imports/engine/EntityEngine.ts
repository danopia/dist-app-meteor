import { Meteor } from "meteor/meteor";
import { ArbitraryEntity, NamespaceEntity } from "../entities/core";
import { Log } from "../lib/logging";
import { ReactiveMap } from "../lib/reactive-map";
import { LogicTracer } from "../lib/tracing";
// import { AsyncCache, AsyncKeyedCache } from "../runtime/async-cache";
import { ShellSession } from "../runtime/ShellSession";
import { MongoEntityStorage, MongoProfileStorage, StaticEntityStorage } from "./EntityStorage";
import { LayeredNamespace } from "./next-gen";

// type ApiFilter<T extends ArbitraryEntity> = {
//   apiVersion: T["apiVersion"];
//   kind: T["kind"];
//   namespace?: string;
//   op: 'Read' | 'Write';
// };

const tracer = new LogicTracer({
  name: 'dist.app/entity-engine',
  requireParent: true,
});

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

  namespaces = new ReactiveMap<string, LayeredNamespace>();
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
    return Array.from(this.namespaces.entries()).filter(x => x[1].selectLayer({
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
  }): Generator<[string, MongoEntityStorage | MongoProfileStorage | StaticEntityStorage]> {
    for (const [name, ns] of this.namespaces.entries()) {
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
    return tracer.asyncSpan('engine insertEntity', {
      attributes: {
        'distapp.entity.api_version': entity.apiVersion,
        'distapp.entity.kind': entity.kind,
        'distapp.entity.namespace': entity.metadata.namespace,
        'distapp.entity.name': entity.metadata.name,
      },
    }, async () => await layer?.impl.insertEntity<T>(entity));
  }

  listEntities<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace?: string
  ): T[] {
    return tracer.syncSpan('engine listEntities', {
      attributes: {
        'distapp.entity.api_version': apiVersion,
        'distapp.entity.kind': kind,
        'distapp.entity.namespace': namespace,
      },
    }, () => {
      const layer = this.selectNamespaceLayer({
        apiVersion: apiVersion,
        kind: kind,
        namespace: namespace,
        op: 'Read',
      });
      return layer.impl.listEntities<T>(apiVersion, kind).map(entity => {
        return {...entity, metadata: {...entity.metadata, namespace: namespace ?? 'default'}};
      });
    });
  }

  getEntity<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace: string | undefined,
    name: string
  ): T | null {
    return tracer.syncSpan('engine getEntity', {
      attributes: {
        'distapp.entity.api_version': apiVersion,
        'distapp.entity.kind': kind,
        'distapp.entity.namespace': namespace,
        'distapp.entity.name': name,
      },
    }, () => {
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
    });
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

  async updateEntity<T extends ArbitraryEntity>(newEntity: T) {
    return tracer.asyncSpan('engine updateEntity', {
      attributes: {
        'distapp.entity.api_version': newEntity.apiVersion,
        'distapp.entity.kind': newEntity.kind,
        'distapp.entity.namespace': newEntity.metadata.namespace,
        'distapp.entity.name': newEntity.metadata.name,
      },
    }, async () => {
      const layer = this.selectNamespaceLayer({
        apiVersion: newEntity.apiVersion,
        kind: newEntity.kind,
        namespace: newEntity.metadata.namespace,
        op: 'Write',
      });

      await layer.impl.updateEntity(newEntity);
      // const count = await layer.impl.updateEntity(newEntity);
      // if (!count)
      //   throw new Error(`TODO: Update applied to zero entities`);
    });
  }

  // Mutation helper
  async mutateEntity<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace: string | undefined,
    name: string, mutationCb: (x: T) => void | Symbol
  ) {
    return tracer.asyncSpan('engine mutateEntity', {
      attributes: {
        'distapp.entity.api_version': apiVersion,
        'distapp.entity.kind': kind,
        'distapp.entity.namespace': namespace,
        'distapp.entity.name': name,
      },
    }, async span => {
      const layer = this.selectNamespaceLayer({
        apiVersion, kind,
        namespace,
        op: 'Write',
      });

      let entity = layer.impl.getEntity(apiVersion, kind, name);
      if (!entity)
        throw new Error(`Entity doesn't exist`);

      for (let i = 0; i <= 3; i++) {
        if (i > 0) {
          Log.warn(`Retrying mutation on ${entity.kind}/${entity.metadata.name} (#${i})`);
        }

        const result = mutationCb(entity);
        if (result == Symbol.for('no-op'))
          return;

        // TODO: retry this if we raced someone else
        try {
          await layer.impl.updateEntity(entity, span);
          return;
        } catch (err) {
          if (err instanceof Meteor.Error && err.error == 'no-update') {
            const richDetailsTODO = err.details as undefined | string | {latestVersion: T};
            if (richDetailsTODO && typeof richDetailsTODO !== 'string' && richDetailsTODO.latestVersion) {
              entity = richDetailsTODO.latestVersion;
              continue;
            }
          } else throw err;
        }

        entity = layer.impl.getEntity(apiVersion, kind, name);
        if (!entity)
          throw new Error(`Entity doesn't exist (anymore)`);
        continue;
      }
      throw new Meteor.Error('no-mutate', `Ran out of retries for mutation.`);
    });
  }

  deleteEntity<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
    namespace: string | undefined,
    name: string
  ) {
    return tracer.asyncSpan('engine deleteEntity', {
      attributes: {
        'distapp.entity.api_version': apiVersion,
        'distapp.entity.kind': kind,
        'distapp.entity.namespace': namespace,
        'distapp.entity.name': name,
      },
    }, async () => {
      const layer = this.selectNamespaceLayer({
        apiVersion, kind,
        namespace,
        op: 'Write',
      });
      return await layer.impl.deleteEntity(apiVersion, kind, name);
    });
  }



  useRemoteNamespace(appUri: string) {
    // const [loadedNs, setLoadedNs] = useState<string|false>(false);

    const appUrl = new URL(appUri);

    if (appUrl.protocol == 'bundled:') {

      // TODO: the fixed namespace sucks!
      const bundledName = decodeURIComponent(appUrl.pathname);
      if (this.namespaces.has(bundledName)) return bundledName;

      this.addNamespace({
        name: bundledName,
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
      return bundledName;
    }
    // console.log('p', appUrl.protocol)

    throw new Error("Function not implemented.");
  }


  findAllEntities<T extends ArbitraryEntity>(
    apiVersion: T["apiVersion"],
    kind: T["kind"],
  ) {
    // Find places where we can find the type of entity
    const namespaces = Array
      .from(this
        .getNamespacesServingApi({
          apiVersion, kind,
          op: 'Read',
        })
        .keys());

    // Collect all of the entities
    return namespaces
      .flatMap(x => this
        .listEntities<T>(apiVersion, kind, x)
        .map(entity => ({ ns: x, entity })));
  }

}
