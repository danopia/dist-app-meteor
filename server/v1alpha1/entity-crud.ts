import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { CatalogsCollection } from "/imports/db/catalogs";
import { ArbitraryEntity, EntitiesCollection } from "/imports/db/entities";
import { MongoEntityStorage } from "/imports/engine/EntityStorage";
import { Log } from "/imports/lib/logging";

function checkAccessRole(actingUserId: string | null, catalogId: string, roles: string[]) {
  if (typeof actingUserId !== 'string') throw new Meteor.Error('user-404', `Not logged in`);

  // const profiles = ProfilesCollection.find({
  //   'members.userId': actingUserId,
  // }).fetch();

  const catalog = CatalogsCollection.findOne({ _id: catalogId });
  if (!catalog) throw new Meteor.Error('catalog-404', `Catalog not found`);

    // console.log({actingUserId, ...catalog, profiles});
}

export async function insertEntity(actingUserId: string | null, catalogId: string, entity: ArbitraryEntity) {
  checkAccessRole(actingUserId, catalogId, ['Editor', 'Owner']);

  check(entity.apiVersion, String);
  check(entity.kind, String);
  check(entity.metadata?.name, String);

  Log.info({message: 'entity insert', catalogId, apiVersion: entity.apiVersion, kind: entity.kind, name: entity.metadata.name});

  const storage = new MongoEntityStorage({catalogId, collection: EntitiesCollection, namespace: catalogId });
  storage.insertEntity(entity);
  return true; // TODO: currently throws instead of 'false'
}

export async function updateEntity(actingUserId: string | null, catalogId: string, newEntity: ArbitraryEntity) {
  checkAccessRole(actingUserId, catalogId, ['Editor', 'Owner']);

  Log.info({message: 'entity update', catalogId, entity: {
    apiVersion: newEntity.apiVersion,
    kind: newEntity.kind,
    name: newEntity.metadata.name,
    generation: newEntity.metadata.generation,
  }});
  // throw new Meteor.Error('todo', `TODO: update`);
  // if ('_id' in newEntity) throw new Error(`_id poisoning`);

  const storage = new MongoEntityStorage({
    catalogId,
    collection: EntitiesCollection,
    namespace: catalogId,
  });
  return storage.updateEntity(newEntity);
}

// TODO: this should probably accept generation too?
export async function deleteEntity(actingUserId: string | null, catalogId: string, apiVersion: string, kind: string, name: string) {
  checkAccessRole(actingUserId, catalogId, ['Editor', 'Owner']);

  Log.info({message: 'entity delete', catalogId, entity: {apiVersion, kind, name}});
  // throw new Meteor.Error('todo', `TODO: delete`);

  const storage = new MongoEntityStorage({catalogId, collection: EntitiesCollection, namespace: catalogId });
  return storage.deleteEntity(apiVersion, kind, name);
  // const _id = JSON.stringify([catalogId, apiVersion, kind, name]);
  // return EntitiesCollection.remove({
  //   _id,
  //   catalogId,
  // }) > 0;
}
