import { Mongo } from "meteor/mongo";
import { Random } from "meteor/random";
import { Entity } from "../api/entities";

export class SessionCatalog {
  constructor() {}

  readonly coll = new Mongo.Collection<{ _id: string } & Entity>(null);
  // readonly catalogId = Random.id();

  insertEntity(entity: Entity) {
    this.coll.insert({
      ...entity,
    });
  }

  findEntities<T extends Entity>(apiVersion: T["apiVersion"], kind: T["kind"]) {
    return this.coll.find({
      apiVersion: apiVersion as any,
      kind: kind as any,
    }) as Mongo.Cursor<T & { _id: string }>;
  }

  getEntity<T extends Entity>(apiVersion: T["apiVersion"], kind: T["kind"], namespace: string | undefined, name: string) {
    return this.coll.findOne({
      apiVersion: apiVersion as any,
      kind: kind as any,
      'metadata.namespace': namespace,
      'metadata.name': name,
    }) as T & { _id: string };
  }

  writeEntity<T extends Entity>(newEntity: T) {
    return this.coll.findOne({
      apiVersion: apiVersion as any,
      kind: kind as any,
      'metadata.namespace': namespace,
      'metadata.name': name,
    }) as T & { _id: string };
  }

  updateEntity<T extends Entity>(apiVersion: T["apiVersion"], kind: T["kind"], namespace: string | undefined, name: string, mutationCb: (x: T) => void) {
    const entity = this.getEntity(apiVersion, kind, namespace, name);
    if (!entity) throw new Error(`Entity doesn't exist`);
    mutationCb(entity);
    this.coll.update({
      apiVersion: apiVersion as any,
      kind: kind as any,
      'metadata.namespace': namespace,
      'metadata.name': name,
    }, entity as (Entity & {_id: string}));
  }
  // observeEntities(apiVersion: string, kind: string, cbs: Mongo.ObserveCallbacks<Entity>) {
  //   return this.coll.find({
  //     apiVersion: apiVersion as any,
  //     kind: kind as any,
  //   }).observe(cbs);
  // }
}
