import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { fetchRequestEntity } from "./fetch";
import { getUserDefaultProfile } from "./profiles";
import { FetchRequestEntity } from "/imports/entities/protocol";

Meteor.methods({

  async '/v1alpha1/create user workspace'() {
    const userId = Meteor.userId();
    if (!userId) throw new Meteor.Error(`logged-out`, `Log in to start a profile.`);
    console.log('new workspace for', userId);
    return await getUserDefaultProfile(userId);
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
