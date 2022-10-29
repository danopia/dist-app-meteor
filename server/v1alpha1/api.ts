import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { Promise } from "meteor/promise";
import { deleteEntity, insertEntity, updateEntity } from "./entity-crud";
import { fetchRequestEntity } from "./fetch";
import { getUserDefaultProfile } from "./profiles";
import { ArbitraryEntity } from "/imports/entities/core";
import { FetchRequestEntity } from "/imports/entities/protocol";

Meteor.methods({


  '/v1alpha1/Entity/insert'(catalogId: unknown, entity: unknown) {
    check(catalogId, String);
    check(entity, Object);
    return Promise.await(insertEntity(this.userId, catalogId, entity as ArbitraryEntity));
  },

  '/v1alpha1/Entity/update'(catalogId: unknown, newEntity: unknown) {
    check(catalogId, String);
    check(newEntity, Object);
    return Promise.await(updateEntity(this.userId, catalogId, newEntity as ArbitraryEntity));
  },

  '/v1alpha1/Entity/delete'(catalogId: unknown, apiVersion: unknown, kind: unknown, name: unknown) {
    check(catalogId, String);
    check(apiVersion, String);
    check(kind, String);
    check(name, String);
    return Promise.await(deleteEntity(this.userId, catalogId, apiVersion, kind, name));
  },


  '/v1alpha1/get user profile'() {
    const userId = Meteor.userId();
    if (!userId) throw new Meteor.Error(`logged-out`, `Log in to start a profile.`);
    return Promise.await(getUserDefaultProfile(userId));
  },

  async 'poc-FetchRequestEntity'(req: FetchRequestEntity) {
    check(req, Object);
    check(req.kind, String);
    return await fetchRequestEntity(req);
  },

  '/v1alpha1/report-error'(stack: unknown) {
    check(stack, String);
    console.log('Browser ' + stack.replace(/\n/g, '\n> '));
  },

  // async '/CatalogUpload/UpsertEntity'(catalogId: unknown, namespaceOverride: unknown, entity: Entity) {
  //   check(catalogId, String);
  //   check(namespaceOverride, String);
  //   check(entity, Object);
  //   check(entity['apiVersion'], String);
  //   check(entity['kind'], String);
  //   return await upsertEntity(catalogId, namespaceOverride, entity);
  // },

  // async '/CatalogUpload/RemoveOtherEntities'(catalogId: unknown, namespaceOverride: unknown, entityIds: string[]) {
  //   check(catalogId, String);
  //   check(namespaceOverride, String);
  //   check(entityIds, Array);
  //   const removedCount = EntitiesCollection.remove({
  //     _id: { $nin: entityIds },
  //     'metadata.catalogId': catalogId,
  //     'metadata.namespace': namespaceOverride,
  //   });
  //   return removedCount;
  // },
});
