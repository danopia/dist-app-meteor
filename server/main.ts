import { Meteor } from 'meteor/meteor';
import { CounterVolatileCatalog } from '../imports/apps/counter-volatile';
import { CounterTaskCatalog } from '../imports/apps/counter-task';
import { EntitiesCollection, Entity } from '/imports/db/entities';
import { WelcomeCatalog } from '/imports/apps/welcome';
import { ToolbeltCatalog } from '/imports/apps/toolbelt';
import { WorldClockCatalog } from '/imports/apps/world-clock';

async function upsertEntity(catalogId: string, entity: Entity) {
  const _id = `${catalogId}/${entity.kind}.${entity.apiVersion}:${entity.metadata.namespace ?? ''}/${entity.metadata.name}`;
  EntitiesCollection.upsert({
    _id,
  }, {
    _id,
    ...entity,
    metadata: {
      catalogId,
      ...entity.metadata,
    },
  });
}

Meteor.startup(async () => {

  EntitiesCollection.remove({});
  for (const entity of CounterTaskCatalog.entries) {
    await upsertEntity('builtin:counter-task', entity);
  }
  for (const entity of CounterVolatileCatalog.entries) {
    await upsertEntity('builtin:counter-volatile', entity);
  }
  for (const entity of WelcomeCatalog.entries) {
    await upsertEntity('builtin:welcome', entity);
  }
  for (const entity of ToolbeltCatalog.entries) {
    await upsertEntity('builtin:toolbelt', entity);
  }
  for (const entity of WorldClockCatalog.entries) {
    await upsertEntity('builtin:world-clock', entity);
  }

});
