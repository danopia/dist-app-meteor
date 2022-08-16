import { Mongo } from 'meteor/mongo';
import { ArbitraryEntity } from '../entities/core';

export const EntitiesCollection = new Mongo.Collection<{
  _id: string;
  // catalogId: string;
} & ArbitraryEntity>('Entities');
export { ArbitraryEntity };
