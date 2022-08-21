import { Mongo } from "meteor/mongo";
import { EntitiesCollection } from "../db/entities";
import { ArbitraryEntity, NamespaceEntity } from "../entities/core";
import { MongoEntityStorage, StaticEntityStorage } from "./EntityStorage";
import { StaticCatalogs } from "./StaticCatalogs";
// import { MongoEntityStorage } from "./next-gen-layer";

// interface EntityStorage {
//   listEntities<T extends ArbitraryEntity>(
//     apiVersion: T["apiVersion"],
//     kind: T["kind"],
//   ): Mongo.Cursor<T>;
//   readEntity<T extends ArbitraryEntity>(
//     apiVersion: T["apiVersion"],
//     kind: T["kind"],
//     name: string,
//   ): T | null;
//   writeEntity<T extends ArbitraryEntity>(
//     newEntity: T,
//   ): T;
//   deleteEntity<T extends ArbitraryEntity>(
//     apiVersion: T["apiVersion"],
//     kind: T["kind"],
//     name: string,
//   ): T | null;
// }

// class CollectionEntityLayer implements EntityStorage {
//   constructor(
//     public readonly spec: NamespaceEntity["spec"]["layers"][number],
//     public readonly coll: Mongo.Collection<ArbitraryEntity>,
//     public readonly extraFilter: {},
//     public readonly extraFields: {},
//   ) {}

//   insertEntity<T extends ArbitraryEntity>(entity: T) {
//     this.coll.insert({
//       ...entity,
//       ...this.extraFields,
//       // metadata: {
//       //   ...entity.metadata,
//       //   catalogId: this.catalogId,
//       //   generation: 1,
//       // },
//     });
//   }

//   listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]) {
//     return this.coll.find({
//       apiVersion: apiVersion,
//       kind: kind,
//       ...this.extraFilter,
//     }) as Mongo.Cursor<T>;
//   }

//   readEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string) {
//     return this.coll.findOne({
//       apiVersion: apiVersion,
//       kind: kind,
//       // 'metadata.namespace': namespace,
//       'metadata.name': name,
//       ...this.extraFilter,
//     }) as T;// & { _id: string };
//   }

//   writeEntity<T extends ArbitraryEntity>(newEntity: T) {
//     if (!newEntity.metadata.generation) throw new Error(`BUG: no generation in update`);
//     const count = this.coll.update({
//       apiVersion: newEntity.apiVersion,
//       kind: newEntity.kind,
//       'metadata.namespace': newEntity.metadata.namespace,
//       'metadata.name': newEntity.metadata.name,
//       'metadata.generation': newEntity.metadata.generation,
//     }, {
//       ...(newEntity as (ArbitraryEntity & {_id: string})),
//       metadata: {
//         ...newEntity.metadata,
//         generation: (newEntity.metadata.generation ?? 0) + 1,
//       },
//     });
//     if (count == 0) throw new Error(`TODO: Update applied to zero entities`);
//   }

//   deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], namespace: string | undefined, name: string) {
//     const count = this.coll.remove({
//       apiVersion: apiVersion,
//       kind: kind,
//       'metadata.catalogId': this.catalogId,
//       'metadata.namespace': namespace,
//       'metadata.name': name,
//     });
//     if (count == 0) throw new Error(`TODO: Delete applied to zero entities`);
//   }
//   // listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[] {
//   //   throw new Error("Method not implemented.");
//   // }
//   // readEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null {
//   //   throw new Error("Method not implemented.");
//   // }
//   // writeEntity<T extends ArbitraryEntity>(newEntity: T): T {
//   //   throw new Error("Method not implemented.");
//   // }
//   // deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null {
//   //   throw new Error("Method not implemented.");
//   // }
// }

// class InMemoryStorage extends CollectionEntityLayer {
//   constructor(spec: NamespaceEntity["spec"]["layers"][number]) {
//     super(spec)
//   }
// }

function buildLayer(namespaceName: string, layerSpec: NamespaceEntity["spec"]["layers"][number]) {
  switch (layerSpec.storage.type) {
    case 'local-inmemory':
      return new MongoEntityStorage({
        collection: new Mongo.Collection<ArbitraryEntity & {_id: string}>(null),
        namespace: namespaceName,
      });
    case 'bundled':
      const staticCat = StaticCatalogs.get(layerSpec.storage.bundleId ?? '');
      if (!staticCat) throw new Error(`Bundled id ${JSON.stringify(layerSpec.storage.bundleId)} not found`);
      return new StaticEntityStorage(staticCat);
      // return new MongoEntityStorage({
      //   collection: EntitiesCollection,
      //   catalogId: layerSpec.storage.bundleId,
      // });
  }
  throw new Error(`BUG: nobody built ${JSON.stringify(layerSpec.storage.type)} layer`);
}

// const storageImpls: Record<NamespaceEntity["spec"]["layers"][number]["storage"]["type"], new (spec: NamespaceEntity["spec"]["layers"][number]) => EntityStorage> = {
//   'local-inmemory': InMemoryStorage,
// };

export class LayeredNamespace {
  constructor(
    public readonly namespaceName: string,
    public readonly spec: NamespaceEntity["spec"],
  ) {
    this.layers = spec.layers.map(x => ({
      ...x,
      impl: buildLayer(namespaceName, x),
    }));
  }
  private readonly layers: Array<NamespaceEntity["spec"]["layers"][number] & {
    impl: MongoEntityStorage | StaticEntityStorage,
  }>;

  selectLayer(props: {
    op: 'Read' | 'Write';
    apiGroup: string;
    apiVersion: string;
    kind: string;
  }) {
    return this.layers.find(x => x.accept.some(y => {
      if (y.apiGroup && y.apiGroup !== props.apiGroup) return false;
      if (y.apiVersion && y.apiVersion !== props.apiVersion) return false;
      if (y.kind && y.kind !== props.kind) return false;
      if (x.mode == 'ReadOnly' && props.op !== 'Read') return false;
      if (x.mode == 'WriteOnly' && props.op !== 'Write') return false;
      return true;
    }))
  }
}
