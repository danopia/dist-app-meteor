import { Mongo } from "meteor/mongo";
import { StaticCatalog } from "../api/catalog";
import { ArbitraryEntity } from "../entities/core";

export interface EntityStorage {
  insertEntity<T extends ArbitraryEntity>(entity: T): void;
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[];
  // watchEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]);
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null;
  updateEntity<T extends ArbitraryEntity>(newEntity: T): T | Promise<T>;
  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): boolean | Promise<boolean>;
}

export class StaticEntityStorage implements EntityStorage {
  constructor(private readonly src: StaticCatalog) {}
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[] {
    return (this.src.entries as ArbitraryEntity[]).filter(x =>
      x.apiVersion == apiVersion && x.kind == kind) as T[];
  }
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null {
    return (this.src.entries as ArbitraryEntity[]).find(x =>
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

export class MongoEntityStorage implements EntityStorage {
  constructor(private readonly props: {
    collection: Mongo.Collection<ArbitraryEntity & {_id: string}>;
    catalogId?: string;
    namespace?: string;
  }) {}

  insertEntity<T extends ArbitraryEntity>(entity: T) {
    const _id = [this.props.catalogId, this.props.namespace, entity.apiVersion, entity.kind, entity.metadata.name].join('_');
    this.props.collection.insert({
      ...entity,
      metadata: {
        namespace: this.props.namespace,
        ...entity.metadata,
        catalogId: this.props.catalogId,
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
    //     'metadata.catalogId': this.props.catalogId,
    //     'metadata.namespace': this.props.namespace,
    //   },
    //   all: this.props.collection.find().fetch(),
    // })
    return (this.props.collection.find({
      apiVersion: apiVersion,
      kind: kind,
      'metadata.catalogId': this.props.catalogId,
      'metadata.namespace': this.props.namespace,
    }) as Mongo.Cursor<T & { _id: string }>).fetch();
  }

  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string) {
    return this.props.collection.findOne({
      apiVersion: apiVersion,
      kind: kind,
      'metadata.catalogId': this.props.catalogId,
      'metadata.namespace': this.props.namespace,
      'metadata.name': name,
    }) as T & { _id: string };
  }

  updateEntity<T extends ArbitraryEntity>(newEntity: T) {
    if (!newEntity.metadata.generation) throw new Error(`BUG: no generation in update`);
    const count = this.props.collection.update({
      apiVersion: newEntity.apiVersion,
      kind: newEntity.kind,
      'metadata.catalogId': this.props.catalogId,
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
    return this.getEntity<T>(newEntity.apiVersion, newEntity.kind, newEntity.metadata.name);
  }

  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string) {
    const count = this.props.collection.remove({
      apiVersion: apiVersion,
      kind: kind,
      'metadata.catalogId': this.props.catalogId,
      'metadata.namespace': this.props.namespace,
      'metadata.name': name,
    });
    return count > 0;
  }

}
