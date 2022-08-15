import { Mongo } from "meteor/mongo";
import { Random } from "meteor/random";
import { Entity } from "../api/entities";
import { EntitiesCollection } from "../db/entities";

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

  insertEntity(entity: Entity) {
    this.coll.insert({
      ...entity,
      metadata: {
        ...entity.metadata,
        catalogId: this.catalogId,
        generation: 1,
      },
    });
  }

  findEntities<T extends Entity>(apiVersion: T["apiVersion"], kind: T["kind"]) {
    return this.coll.find({
      apiVersion: apiVersion as any,
      kind: kind as any,
      'metadata.catalogId': this.catalogId,
    }) as Mongo.Cursor<T & { _id: string }>;
  }

  getEntity<T extends Entity>(apiVersion: T["apiVersion"], kind: T["kind"], namespace: string | undefined, name: string) {
    return this.coll.findOne({
      apiVersion: apiVersion as any,
      kind: kind as any,
      'metadata.catalogId': this.catalogId,
      'metadata.namespace': namespace,
      'metadata.name': name,
    }) as T & { _id: string };
  }

  updateEntity<T extends Entity>(newEntity: T) {
    if (!newEntity.metadata.generation) throw new Error(`BUG: no generation in update`);
    const count = this.coll.update({
      apiVersion: newEntity.apiVersion as any,
      kind: newEntity.kind as any,
      'metadata.catalogId': this.catalogId,
      'metadata.namespace': newEntity.metadata.namespace,
      'metadata.name': newEntity.metadata.name,
      'metadata.generation': newEntity.metadata.generation,
    }, {
      ...(newEntity as (Entity & {_id: string})),
      metadata: {
        ...newEntity.metadata,
        generation: (newEntity.metadata.generation ?? 0) + 1,
      },
    });
    if (count == 0) throw new Error(`TODO: Update applied to zero entites`);
  }

  // Mutation helper
  mutateEntity<T extends Entity>(apiVersion: T["apiVersion"], kind: T["kind"], namespace: string | undefined, name: string, mutationCb: (x: T) => void) {
    const entity = this.getEntity(apiVersion, kind, namespace, name);
    if (!entity) throw new Error(`Entity doesn't exist`);
    mutationCb(entity);
    this.updateEntity(entity);
  }
}
