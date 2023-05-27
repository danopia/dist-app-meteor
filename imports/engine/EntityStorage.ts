import { Mongo } from "meteor/mongo";
import { Entity } from "/imports/entities";
import { ArbitraryEntity } from "../entities/core";
import { ProfilesCollection } from "../db/profiles";
import { EntitiesCollection, EntityDoc } from "../db/entities";
import { meteorCallAsyncWithSpan } from "../lib/meteor-call";
import { Meteor } from "meteor/meteor";
import { Span } from "@opentelemetry/api";
import { DDP } from "meteor/ddp";
import { Tracker } from "meteor/tracker";

export interface EntityStorage {
  insertEntity<T extends ArbitraryEntity>(entity: T): void | Promise<void>;
  listAllEntities(): ArbitraryEntity[];
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[];
  // watchEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]);
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null;
  updateEntity<T extends ArbitraryEntity>(newEntity: T, span?: Span): void | Promise<void>;
  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): boolean | Promise<boolean>;
}

export class StaticEntityStorage implements EntityStorage {
  constructor(private readonly src: Array<Entity>) {}
  listAllEntities() {
    return this.src.slice(0);
  }
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[] {
    return (this.src as ArbitraryEntity[]).filter(x =>
      x.apiVersion == apiVersion && x.kind == kind) as T[];
  }
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null {
    return (this.src as ArbitraryEntity[]).find(x =>
      x.apiVersion == apiVersion && x.kind == kind && x.metadata.name == name) as T;
  }
  insertEntity(): void {
    throw new Meteor.Error('is-readonly', "StaticEntityStorage is a read-only store.");
  }
  updateEntity(): void | Promise<void> {
    throw new Meteor.Error('is-readonly', "StaticEntityStorage is a read-only store.");
  }
  deleteEntity(): boolean | Promise<boolean> {
    throw new Meteor.Error('is-readonly', "StaticEntityStorage is a read-only store.");
  }
}

export class MongoProfileStorage implements EntityStorage {
  constructor(
    public readonly profileId: string,
    public readonly namespaceName: string,
  ) {}
  insertEntity<T extends ArbitraryEntity>(entity: T): void | Promise<void> {
    return this.getStorage(entity.apiVersion, true)!.insertEntity(entity);
  }
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]): T[] {
    return this.getStorage(apiVersion, false)?.listEntities(apiVersion, kind) ?? [];
  }
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): T | null {
    return this.getStorage(apiVersion, false)?.getEntity(apiVersion, kind, name) ?? null;
  }
  updateEntity<T extends ArbitraryEntity>(newEntity: T, span?: Span): void | Promise<void> {
    return this.getStorage(newEntity.apiVersion, true)!.updateEntity(newEntity, span);
  }
  deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string): boolean | Promise<boolean> {
    return this.getStorage(apiVersion, true)!.deleteEntity(apiVersion, kind, name);
  }
  getStorage(apiVersion: string, required: boolean) {
    // TODO: use LayeredNamespace for this logic instead
    const [apiGroup, _version] = apiVersion.split('/');
    const profile = ProfilesCollection.findOne({ _id: this.profileId });
    if (!profile) {
      if (!required) return null;
      throw new Meteor.Error('no-storage', `No storage matched profile ${this.profileId}`);
    }
    const layer = profile.layers.find(x => x.apiFilters.length == 0
      || x.apiFilters.some(y => {
        if (y.apiGroup && y.apiGroup !== apiGroup) return false;
        if (y.apiVersion && y.apiVersion !== apiVersion) return false;
        // if (y.kind && y.kind !== props.kind) return false;
        // if (x.mode == 'ReadOnly' && props.op !== 'Read') return false;
        // if (x.mode == 'WriteOnly' && props.op !== 'Write') return false;
        return true;
      }));
    if (!layer) {
      if (!required) return null;
      throw new Error(`No storage matched api filter ${apiGroup}`);
    }
    const banner = 'local-catalog:';
    if (layer.backingUrl.startsWith(banner)) {
      const catalogId = layer.backingUrl.slice(banner.length);
      return new MeteorEntityStorage({
        catalogId: catalogId,
        namespace: this.namespaceName,
      });
    }
    throw new Error(`TODO: umimpl mongo type`);
  }
  listAllEntities() {
    const profile = ProfilesCollection.findOne({ _id: this.profileId });
    if (!profile) {
      throw new Meteor.Error('no-storage', `No storage matched profile ${this.profileId}`);
    }
    const allLayers = profile.layers.map(layer => {
      const banner = 'local-catalog:';
      if (layer.backingUrl.startsWith(banner)) {
        const catalogId = layer.backingUrl.slice(banner.length);
        return new MeteorEntityStorage({
          catalogId: catalogId,
          namespace: this.namespaceName,
        });
      }
      throw new Error(`TODO: umimpl mongo type`);
    });
    return allLayers.flatMap(x => x.listAllEntities());
  }
}

export class MongoEntityStorage implements EntityStorage {
  constructor(private readonly props: {
    collection: Mongo.Collection<ArbitraryEntity & {catalogId: string; _id: string}>;
    catalogId: string;
    namespace: string;
  }) {}

  insertEntity<T extends ArbitraryEntity>(entity: T) {
    const _id = [
      this.props.catalogId,
      "",
      entity.apiVersion,
      entity.kind,
      entity.metadata.name,
    ].join('_');

    this.props.collection.insert({
      ...entity,
      catalogId: this.props.catalogId,
      metadata: {
        ...entity.metadata,
        namespace: undefined,
        creationTimestamp: new Date(),
        generation: 1,
      },
      _id,
    });
  }

  listAllEntities() {
    return this.props.collection.find({
      catalogId: this.props.catalogId,
    }, {
      fields: {
        // _id: 0,
        catalogId: 0,
      },
    }).fetch().map(x => ({ ...x, metadata: { ...x.metadata, namespace: this.props.namespace } }));
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
    }) as Mongo.Cursor<T & { catalogId: string; _id: string }>).fetch()
      .map(x => ({ ...x, metadata: { ...x.metadata, namespace: this.props.namespace } }));
  }

  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string) {
    const entity = this.props.collection.findOne({
      catalogId: this.props.catalogId,
      apiVersion: apiVersion,
      kind: kind,
      // 'metadata.namespace': this.props.namespace,
      'metadata.name': name,
    }) as T & { catalogId: string; _id: string };

    return entity ? { ...entity,
      metadata: { ...entity.metadata, namespace: this.props.namespace },
    } : entity;
  }

  updateEntity<T extends ArbitraryEntity>(newEntity: T) {
    if (!newEntity.metadata.generation) throw new Meteor.Error(`bug`,
      `no generation in update`);
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
        updateTimestamp: new Date(),
        generation: (newEntity.metadata.generation ?? 0) + 1,
      },
    });
    // return count > 0;
    if (count == 0) {
      // console.log('desired:', newEntity);
      // TODO: this is not a good way of passing error details (but we do want them, to reduce round-trips)
      const latestVersion = this.getEntity<T>(newEntity.apiVersion, newEntity.kind, newEntity.metadata.name);
      throw new Meteor.Error('no-update', `updateEntity didn't apply any change`, {latestVersion});
    }
    // return this.getEntity<T>(newEntity.apiVersion, newEntity.kind, newEntity.metadata.name);
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

const remoteConns = new Map<string, DDP.DDPStatic>();
const entitiesColls = new Map<DDP.DDPStatic, Mongo.Collection<EntityDoc>>();

export class MeteorEntityStorage implements EntityStorage {
  constructor(private readonly props: {
    remoteUrl?: string;
    catalogId: string;
    namespace: string;
  }) {
    let coll = EntitiesCollection;

    if (props.remoteUrl) {
      let remoteConn = remoteConns.get(props.remoteUrl);
      if (!remoteConn) {
        console.info('Connecting to', props.remoteUrl);
        //@ts-expect-error second argument is untyped
        remoteConn = DDP.connect(props.remoteUrl, {
          _sockjsOptions: {
            // prevent XHR fallback
            transports: ['websocket'],
          },
        });
        remoteConns.set(props.remoteUrl, remoteConn);
      }

      let remoteColl = entitiesColls.get(remoteConn);
      if (!remoteColl) {
        remoteColl = new Mongo.Collection('Entities', {
          connection: remoteConn,
        });
        entitiesColls.set(remoteConn, remoteColl);
      }

      Tracker.nonreactive(() => {
        remoteConn?.subscribe('/v1alpha1/catalogs/by-id/composite', props.catalogId);
      });
      coll = remoteColl;
    }

    this.readStorage = new MongoEntityStorage({
      collection: coll,
      catalogId: props.catalogId,
      namespace: props.namespace,
    });
  }
  private readonly readStorage: MongoEntityStorage;

  listAllEntities(): ArbitraryEntity[] {
    return this.readStorage.listAllEntities();
  }
  listEntities<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"]) {
    return this.readStorage.listEntities(apiVersion, kind);
  }
  getEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string) {
    return this.readStorage.getEntity(apiVersion, kind, name);
  }

  // TODO: the span should probably be set before calling into these
  async insertEntity<T extends ArbitraryEntity>(entity: T, span?: Span) {
    await meteorCallAsyncWithSpan(span, '/v1alpha1/Entity/insert', this.props.catalogId, entity);
  }
  async updateEntity<T extends ArbitraryEntity>(newEntity: T, span?: Span) {
    await meteorCallAsyncWithSpan<void>(span, '/v1alpha1/Entity/update', this.props.catalogId, newEntity);
  }
  async deleteEntity<T extends ArbitraryEntity>(apiVersion: T["apiVersion"], kind: T["kind"], name: string, span?: Span) {
    return await meteorCallAsyncWithSpan<boolean>(span, '/v1alpha1/Entity/delete', this.props.catalogId, apiVersion, kind, name);
  }
}
