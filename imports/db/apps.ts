import { Mongo } from 'meteor/mongo';

export interface App {
  _id?: string;
  title: string;
  url: string;
  createdAt: Date;
}

export const AppsCollection = new Mongo.Collection<App>('Apps');
