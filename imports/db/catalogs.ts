import { Mongo } from 'meteor/mongo';

export interface CatalogDoc {
  _id: string;
  createdAt: Date;
  description?: string;
  // catalogId: string;
  accessRules: Array<{
    mode: 'ReadOnly' | 'ReadWrite' | 'WriteOnly';
    subject: string;
  }>;
  // backingStore: {
  //   type: 'dynamic',
  // },
  apiFilters: Array<{
    apiGroup?: string;
    apiVersion?: string;
    kind?: string;
  }>;

  usage?: {
    entities: number;
    bytes: number;
  };
}
export const CatalogsCollection = new Mongo.Collection<CatalogDoc>('Catalogs');
