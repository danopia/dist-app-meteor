import { Mongo } from 'meteor/mongo';

import { ArbitraryEntity } from '../entities/core';
export { ArbitraryEntity };

export type EntityDoc = ArbitraryEntity & {
  _id: string;
  catalogId: string;
  // layerId: string;
  // entity: ArbitraryEntity;
}
export const EntitiesCollection = new Mongo.Collection<EntityDoc>('Entities');
