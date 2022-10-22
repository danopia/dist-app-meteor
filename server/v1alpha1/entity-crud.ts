import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { CatalogsCollection } from "/imports/db/catalogs";
import { ArbitraryEntity, EntitiesCollection } from "/imports/db/entities";
import { ProfilesCollection } from "/imports/db/profiles";
import { MongoEntityStorage } from "/imports/engine/EntityStorage";

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

  console.log('insert', {catalogId, apiVersion: entity.apiVersion, kind: entity.kind, name: entity.metadata.name});

  const storage = new MongoEntityStorage({catalogId, collection: EntitiesCollection });
  storage.insertEntity(entity);

  // const _id = JSON.stringify([catalogId, entity.apiVersion, entity.kind, entity.metadata.name]);
  // EntitiesCollection.insert({
  //   ...entity,
  //   _id,
  //   catalogId,
  //   metadata: {
  //     ...entity.metadata,
  //     generation: 1,
  //   },
  // });
  return true; // TODO: currently throws instead of 'false'
  // throw new Meteor.Error('todo', `TODO`);
}

export async function updateEntity(actingUserId: string | null, catalogId: string, newEntity: ArbitraryEntity) {
  checkAccessRole(actingUserId, catalogId, ['Editor', 'Owner']);

  console.log('update', {catalogId, entity: newEntity});
  // throw new Meteor.Error('todo', `TODO: update`);
  // if ('_id' in newEntity) throw new Error(`_id poisoning`);

  const storage = new MongoEntityStorage({catalogId, collection: EntitiesCollection });
  return storage.updateEntity(newEntity);
  // const _id = JSON.stringify([catalogId, newEntity.apiVersion, newEntity.kind, newEntity.metadata.name]);
  // return EntitiesCollection.update({
  //   _id,
  //   catalogId,
  //   'metadata.generation': newEntity.metadata.generation,
  // }, {$set: {
  //   ...newEntity,
  //   _id,
  //   catalogId,
  //   metadata: {
  //     ...newEntity.metadata,
  //     generation: newEntity.metadata.generation! + 1,
  //   },
  // }}) > 0;
}

// TODO: this should probably accept generation too?
export async function deleteEntity(actingUserId: string | null, catalogId: string, apiVersion: string, kind: string, name: string) {
  checkAccessRole(actingUserId, catalogId, ['Editor', 'Owner']);

  console.log('delete', {catalogId, entity: {apiVersion, kind, name}});
  // throw new Meteor.Error('todo', `TODO: delete`);

  const storage = new MongoEntityStorage({catalogId, collection: EntitiesCollection });
  return storage.deleteEntity(apiVersion, kind, name);
  // const _id = JSON.stringify([catalogId, apiVersion, kind, name]);
  // return EntitiesCollection.remove({
  //   _id,
  //   catalogId,
  // }) > 0;
}
