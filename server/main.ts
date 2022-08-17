import { Meteor } from 'meteor/meteor';
import { CounterVolatileCatalog } from '../imports/apps/counter-volatile';
import { CounterTaskCatalog } from '../imports/apps/counter-task';
import { EntitiesCollection, Entity } from '/imports/db/entities';
import { WelcomeCatalog } from '/imports/apps/welcome';
import { ToolbeltCatalog } from '/imports/apps/toolbelt';
import { WorldClockCatalog } from '/imports/apps/world-clock';

async function applyManifests(catalogId: string, namespace: string, entities: Entity[]) {
  const allIds = new Array<string>();
  for (const entity of entities) {
    allIds.push(await upsertEntity(catalogId, namespace, entity));
  }
  const removed = EntitiesCollection.remove({
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

Meteor.startup(async () => {

  EntitiesCollection.remove({});
  await applyManifests('system:bundled-apps', 'counter-task', CounterTaskCatalog.entries);
  await applyManifests('system:bundled-apps', 'counter-volatile', CounterVolatileCatalog.entries);
  await applyManifests('system:bundled-apps', 'welcome', WelcomeCatalog.entries);
  await applyManifests('system:bundled-apps', 'toolbelt', ToolbeltCatalog.entries);
  await applyManifests('system:bundled-apps', 'world-clock', WorldClockCatalog.entries);

});
