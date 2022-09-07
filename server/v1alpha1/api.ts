import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { upsertEntity } from "./catalog-upload";
import { fetchRequestEntity } from "./fetch";
import { EntitiesCollection } from "/imports/db/entities";
import { Entity } from "/imports/entities";
import { FetchRequestEntity } from "/imports/entities/protocol";

Meteor.methods({

  async 'poc-FetchRequestEntity'(req: FetchRequestEntity) {
    check(req, Object);
    check(req.kind, String);
    return await fetchRequestEntity(req);
  },


  async '/CatalogUpload/UpsertEntity'(catalogId: unknown, namespaceOverride: unknown, entity: Entity) {
    check(catalogId, String);
    check(namespaceOverride, String);
    check(entity, Object);
    check(entity['apiVersion'], String);
    check(entity['kind'], String);
    return await upsertEntity(catalogId, namespaceOverride, entity);
  },

  async '/CatalogUpload/RemoveOtherEntities'(catalogId: unknown, namespaceOverride: unknown, entityIds: string[]) {
    check(catalogId, String);
    check(namespaceOverride, String);
    check(entityIds, Array);
    const removedCount = EntitiesCollection.remove({
      _id: { $nin: entityIds },
      'metadata.catalogId': catalogId,
      'metadata.namespace': namespaceOverride,
    });
    return removedCount;
  },
});
