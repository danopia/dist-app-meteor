import 'happy-eyeballs/eye-patch';

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EntitiesCollection } from '/imports/db/entities';
import { Entity } from '/imports/entities';

async function applyManifests(catalogId: string, namespace: string, entities: Entity[]) {
  const allIds = new Array<string>();
  for (const entity of entities) {
    allIds.push(await upsertEntity(catalogId, namespace, entity));
  }
  EntitiesCollection.remove({
    _id: { $nin: allIds },
    'metadata.catalogId': catalogId,
    'metadata.namespace': namespace,
  });
}

async function upsertEntity(catalogId: string, namespaceOverride: string | null, entity: Entity) {
  const namespace = namespaceOverride ?? entity.metadata.namespace ?? '';
  const _id = `${catalogId}/${entity.kind}.${entity.apiVersion}:${namespace}/${entity.metadata.name}`;
  EntitiesCollection.upsert({
    _id,
  }, {
    _id,
    ...entity,
    metadata: {
      catalogId, // TODO: remove from public API
      namespace,
      ...entity.metadata,
    },
  });
  return _id;
}

Meteor.methods({
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
})

Meteor.startup(async () => {

  // EntitiesCollection.remove({});
  // await applyManifests('system:bundled-apps', 'counter-task', CounterTaskCatalog.entries);
  // await applyManifests('system:bundled-apps', 'counter-volatile', CounterVolatileCatalog.entries);
  // await applyManifests('system:bundled-apps', 'welcome', WelcomeCatalog.entries);
  // await applyManifests('system:bundled-apps', 'toolbelt', ToolbeltCatalog.entries);
  // await applyManifests('system:bundled-apps', 'world-clock', WorldClockCatalog.entries);

});

import { fetch, Headers } from 'meteor/fetch';

Meteor.methods({
  async 'poc-http-fetch'(req: {
    url: string;
    method: string;
    headers: Array<[string,string]>;
    body?: string;
  }) {
    console.log('poc-http-fetch:', req);

    if (req.url === 'dist-app:/protocolendpoints/http/invoke' && req.body) {
      const spec: {input: {
        url: string;
        method: string;
        headers: Array<[string,string]>;
        body?: string;
      }} = JSON.parse(req.body);
      if (!spec.input.url.startsWith('https://da.gd/')) throw new Meteor.Error('http-sandbox',
        `This domain is not reachable for the current user`);

      const resp = await fetch(spec.input.url, {
        method: spec.input.method,
        headers: new Headers(spec.input.headers ?? []),
        body: spec.input.body,
      });
      console.log(`remote server gave HTTP ${resp.status} to ${spec.input.method} ${spec.input.url}`);
      return {
        status: 200,
        headers: [
          ['content-type', 'application/json'],
        ],
        body: JSON.stringify({
          status: resp.status,
          headers: Array.from(resp.headers),
          body: await resp.text(),
        }),
      };
    }

    return {
      status: 429,
      headers: [],
      body: 'im a teapot',
    };
  }
})
