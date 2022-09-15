import { Mongo } from "meteor/mongo";
import { ArbitraryEntity, NamespaceEntity } from "../entities/core";
import { MongoEntityStorage, MongoProfileStorage, StaticEntityStorage } from "./EntityStorage";
import { StaticCatalogs } from "./StaticCatalogs";
// import { MongoEntityStorage } from "./next-gen-layer";

function buildLayer(namespaceName: string, layerSpec: NamespaceEntity["spec"]["layers"][number]) {
  switch (layerSpec.storage.type) {
    case 'local-inmemory':
      return new MongoEntityStorage({
        collection: new Mongo.Collection<ArbitraryEntity & { catalogId: string; _id: string }>(null),
        namespace: namespaceName,
        catalogId: 'x',
      });
    case 'bundled':
      const staticCat = StaticCatalogs.get(layerSpec.storage.bundleId ?? '');
      if (!staticCat) throw new Error(`Bundled id ${JSON.stringify(layerSpec.storage.bundleId)} not found`);
      return new StaticEntityStorage(staticCat);
    case 'profile':
      return new MongoProfileStorage(layerSpec.storage.profileId);
  }
  //@ts-expect-error should be exhaustive thus 'never'
  throw new Error(`BUG: nobody built ${JSON.stringify(layerSpec.storage.type)} layer`);
}

// const storageImpls: Record<NamespaceEntity["spec"]["layers"][number]["storage"]["type"], new (spec: NamespaceEntity["spec"]["layers"][number]) => EntityStorage> = {
//   'local-inmemory': InMemoryStorage,
// };

// TODO: use this for profiles too
export class LayeredNamespace {
  constructor(
    public readonly namespaceName: string, // TODO: remove namespace construct
    public readonly spec: NamespaceEntity["spec"],
  ) {
    this.layers = spec.layers.map(x => ({
      ...x,
      impl: buildLayer(namespaceName, x),
    }));
  }
  private readonly layers: Array<NamespaceEntity["spec"]["layers"][number] & {
    impl: MongoEntityStorage | MongoProfileStorage | StaticEntityStorage,
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
