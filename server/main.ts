import { Meteor } from 'meteor/meteor';
import { CounterVolatileCatalog } from '../imports/apps/counter-volatile';
import { CounterTaskCatalog } from '../imports/apps/counter-task';
import { EntitiesCollection, Entity } from '/imports/db/entities';

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

});
