import { Mongo } from "meteor/mongo";
import { Entity } from "/imports/entities";
import { ArbitraryEntity } from "../entities/core";
import { ProfilesCollection } from "../db/profiles";
import { EntitiesCollection } from "../db/entities";

export interface EntityStorage {
  insertEntity<T extends ArbitraryEntity>(entity: T): void;
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[];
  // watchEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]);
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null;
  updateEntity<T extends ArbitraryEntity>(newEntity: T): T | Promise<T>;
  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): boolean | Promise<boolean>;
}

export class StaticEntityStorage implements EntityStorage {
  constructor(private readonly src: Array<Entity>) {}
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[] {
    return (this.src as ArbitraryEntity[]).filter(x =>
      x.apiVersion == apiVersion && x.kind == kind) as T[];
  }
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null {
    return (this.src as ArbitraryEntity[]).find(x =>
      x.apiVersion == apiVersion && x.kind == kind && x.metadata.name == name) as T;
  }
  insertEntity<T extends ArbitraryEntity>(entity: T): void {
    throw new Error("Method not implemented.");
  }
  updateEntity<T extends ArbitraryEntity>(newEntity: T): T | Promise<T> {
    throw new Error("Method not implemented.");
  }
  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): boolean | Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}

export class MongoProfileStorage implements EntityStorage {
  constructor(public readonly profileId: string) {}
  insertEntity<T extends ArbitraryEntity>(entity: T): void {
    return this.getStorage(entity.apiVersion)!.insertEntity(entity);
  }
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[] {
    return this.getStorage(apiVersion)?.listEntities(apiVersion, kind) ?? [];
  }
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null {
    return this.getStorage(apiVersion)!.getEntity(apiVersion, kind, name);
  }
  updateEntity<T extends ArbitraryEntity>(newEntity: T): T | Promise<T> {
    return this.getStorage(newEntity.apiVersion)!.updateEntity(newEntity);
  }
  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): boolean | Promise<boolean> {
    return this.getStorage(apiVersion)!.deleteEntity(apiVersion, kind, name);
  }
  getStorage(apiVersion: string) {
    // TODO: use LayeredNamespace for this logic instead
    const [apiGroup, version] = apiVersion.split('/');
    const profile = ProfilesCollection.findOne({ _id: this.profileId });
    if (!profile) return null;
    const layer = profile.layers.find(x => x.apiFilters.some(y => y.apiGroup == apiGroup));
    if (!layer) return null;
    const banner = 'local-catalog:';
    if (layer.backingUrl.startsWith(banner)) {
      const catalogId = layer.backingUrl.slice(banner.length);
      return new MongoEntityStorage({
        collection: EntitiesCollection,
        catalogId: catalogId,
      });
    }
    throw new Error(`TODO: umimpl mongo type`);
  }
}

export class MongoEntityStorage implements EntityStorage {
  constructor(private readonly props: {
    collection: Mongo.Collection<ArbitraryEntity & {catalogId: string; _id: string}>;
    catalogId: string;
    namespace?: string;
  }) {}

  insertEntity<T extends ArbitraryEntity>(entity: T) {
    const _id = [this.props.catalogId, this.props.namespace, entity.apiVersion, entity.kind, entity.metadata.name].join('_');
    this.props.collection.insert({
      ...entity,
      catalogId: this.props.catalogId,
      metadata: {
        // namespace: this.props.namespace,
        ...entity.metadata,
        // catalogId: this.props.catalogId,
        generation: 1,
      },
      _id,
    });
  }

  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]) {
    // console.log({
    //   filter: {
    //     apiVersion: apiVersion,
    //     kind: kind,
    //     catalogId: this.props.catalogId,
    //     'metadata.namespace': this.props.namespace,
    //   },
    //   all: this.props.collection.find().fetch(),
    // })
    return (this.props.collection.find({
      catalogId: this.props.catalogId,
      apiVersion: apiVersion,
      kind: kind,
      // 'metadata.namespace': this.props.namespace,
    }) as Mongo.Cursor<T & { catalogId: string; _id: string }>).fetch();
  }

  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string) {
    return this.props.collection.findOne({
      catalogId: this.props.catalogId,
      apiVersion: apiVersion,
      kind: kind,
      // 'metadata.namespace': this.props.namespace,
      'metadata.name': name,
    }) as T & { catalogId: string; _id: string };
  }

  updateEntity<T extends ArbitraryEntity>(newEntity: T) {
    if (!newEntity.metadata.generation) throw new Error(`BUG: no generation in update`);
    const count = this.props.collection.update({
      catalogId: this.props.catalogId,
      apiVersion: newEntity.apiVersion,
      kind: newEntity.kind,
      // 'metadata.namespace': newEntity.metadata.namespace,
      'metadata.name': newEntity.metadata.name,
      'metadata.generation': newEntity.metadata.generation,
    }, {
      ...(newEntity as (ArbitraryEntity & { _id: string })),
      catalogId: this.props.catalogId,
      metadata: {
        ...newEntity.metadata,
        generation: (newEntity.metadata.generation ?? 0) + 1,
      },
    });
    return this.getEntity<T>(newEntity.apiVersion, newEntity.kind, newEntity.metadata.name);
  }

  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string) {
    const count = this.props.collection.remove({
      catalogId: this.props.catalogId,
      apiVersion: apiVersion,
      kind: kind,
      // 'metadata.namespace': this.props.namespace,
      'metadata.name': name,
    });
    return count > 0;
  }

}
