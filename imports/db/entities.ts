import { Mongo } from 'meteor/mongo';
import { Entity } from '/imports/api/entities';

export const EntitiesCollection = new Mongo.Collection<{
  _id: string;
  // catalogId: string;
} & Entity>('Entities');
export { Entity };
