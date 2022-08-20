import { Mongo } from "meteor/mongo";
import { EntitiesCollection } from "../db/entities";
import { ArbitraryEntity } from "../entities/core";

export class SessionCatalog {
  constructor(syncedCatalogId?: string) {
    if (syncedCatalogId) {
      this.catalogId = syncedCatalogId;
      this.coll = EntitiesCollection;
    } else {
      this.catalogId = undefined;
      this.coll = new Mongo.Collection(null);
    }
  }

  private readonly catalogId: string | undefined;
  private readonly coll: typeof EntitiesCollection;

  insertEntity<T extends ArbitraryEntity>(entity: T) {
    this.coll.insert({
      ...entity,
      metadata: {
        ...entity.metadata,
        catalogId: this.catalogId,
        generation: 1,
      },
    });
  }

  findEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]) {
    return this.coll.find({
      apiVersion: apiVersion as any,
      kind: kind as any,
      'metadata.catalogId': this.catalogId,
    }) as Mongo.Cursor<T & { _id: string }>;
  }

  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], namespace: string | undefined, name: string) {
    return this.coll.findOne({
      apiVersion: apiVersion as any,
      kind: kind as any,
      'metadata.catalogId': this.catalogId,
      'metadata.namespace': namespace,
      'metadata.name': name,
    }) as T & { _id: string };
  }

  updateEntity<T extends ArbitraryEntity>(newEntity: T) {
    if (!newEntity.metadata.generation) throw new Error(`BUG: no generation in update`);
    const count = this.coll.update({
      apiVersion: newEntity.apiVersion as any,
      kind: newEntity.kind as any,
      'metadata.catalogId': this.catalogId,
      'metadata.namespace': newEntity.metadata.namespace,
      'metadata.name': newEntity.metadata.name,
      'metadata.generation': newEntity.metadata.generation,
    }, {
      ...(newEntity as (ArbitraryEntity & {_id: string})),
      metadata: {
        ...newEntity.metadata,
        generation: (newEntity.metadata.generation ?? 0) + 1,
      },
    });
    if (count == 0) throw new Error(`TODO: Update applied to zero entities`);
  }

  // Mutation helper
  mutateEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], namespace: string | undefined, name: string, mutationCb: (x: T) => void | Symbol) {
    const entity = this.getEntity(apiVersion, kind, namespace, name);
    if (!entity) throw new Error(`Entity doesn't exist`);

    const result = mutationCb(entity);
    if (result == Symbol.for('no-op')) return;

    this.updateEntity(entity);
  }

  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], namespace: string | undefined, name: string) {
    const count = this.coll.remove({
      apiVersion: apiVersion,
      kind: kind,
      'metadata.catalogId': this.catalogId,
      'metadata.namespace': namespace,
      'metadata.name': name,
    });
    if (count == 0) throw new Error(`TODO: Delete applied to zero entities`);
  }

}
