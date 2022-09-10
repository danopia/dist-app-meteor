import { Mongo } from "meteor/mongo";

export interface ProfileDoc {
  _id: string;
  createdAt: Date;
  description?: string;
  members: Array<{
    basicRole: 'Viewer' | 'Editor' | 'Owner';
    userId: string;
  }>;
  layers: Array<{
    // namespace: string;
    backingUrl: string;
    // mode: 'ReadOnly' | 'ReadWrite' | 'WriteOnly';
    apiFilters: Array<{
      apiGroup?: string;
      apiVersion?: string;
      kind?: string;
    }>;
  }>;
}
export const ProfilesCollection = new Mongo.Collection<ProfileDoc>('Profiles');
