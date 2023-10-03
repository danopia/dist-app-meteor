import { check, Match } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { Promise } from "meteor/promise";
import { deleteEntity, insertEntity, updateEntity } from "./entity-crud";
import { fetchRequestEntity } from "./fetch";
import { getUserDefaultProfile } from "./profiles";
import { ArbitraryEntity } from "/imports/entities/core";
import { FetchRequestEntity } from "/imports/entities/protocol";
import { handleCapCall } from "./handle-submissions";

import './publications';
import { trace } from "@opentelemetry/api";

import './catalog-operator';

Meteor.methods({

  async '/v1alpha1/Entity/submit'(entity: unknown) {
    this.unblock();
    check(entity, Match.ObjectIncluding({kind: String}));
    // TODO: wrap submissions in their own span by kind
    trace.getActiveSpan()?.setAttributes({
      'distapp.entity_kind': entity.kind,
    });
    if (entity.kind == 'CapCall') {
      return await handleCapCall(this.userId, entity as ArbitraryEntity);
    }
    console.warn('TODO', entity)
  },

  async '/v1alpha1/Entity/insert'(catalogId: unknown, entity: unknown) {
    this.unblock();
    check(catalogId, String);
    check(entity, Object);
    return await insertEntity(this.userId, catalogId, entity as ArbitraryEntity);
  },

  async '/v1alpha1/Entity/update'(catalogId: unknown, newEntity: unknown) {
    this.unblock();
    check(catalogId, String);
    check(newEntity, Object);
    return await updateEntity(this.userId, catalogId, newEntity as ArbitraryEntity);
  },

  async '/v1alpha1/Entity/delete'(catalogId: unknown, apiVersion: unknown, kind: unknown, name: unknown) {
    this.unblock();
    check(catalogId, String);
    check(apiVersion, String);
    check(kind, String);
    check(name, String);
    return await deleteEntity(this.userId, catalogId, apiVersion, kind, name);
  },


  async '/v1alpha1/get user profile'() {
    const userId = Meteor.userId();
    if (!userId) throw new Meteor.Error(`logged-out`, `Log in to start a profile.`);
    return await getUserDefaultProfile(userId);
  },

  async 'poc-FetchRequestEntity'(req: FetchRequestEntity) {
    this.unblock();
    check(req, Object);
    check(req.kind, String);
    return await fetchRequestEntity(req);
  },

  async '/v1alpha1/report-error'(stack: unknown) {
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
