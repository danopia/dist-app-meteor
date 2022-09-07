import { EntitiesCollection } from "/imports/db/entities";
import { Entity } from "/imports/entities";

export async function applyManifests(catalogId: string, namespace: string, entities: Entity[]) {
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

export async function upsertEntity(catalogId: string, namespaceOverride: string | null, entity: Entity) {
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
