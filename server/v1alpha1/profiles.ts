import { Meteor } from "meteor/meteor";
import { CatalogsCollection } from "/imports/db/catalogs";
import { EntitiesCollection } from "../../imports/db/entities";
import { ProfilesCollection } from "/imports/db/profiles";
import { WorkspaceEntity } from "/imports/entities/runtime";
import { AppInstallationEntity } from "/imports/entities/profile";

// Forcibly reserve a 'system' userId
// It'll be technically possible for admins to get interactive access to this user.
Meteor.startup(async () => {
  Meteor.users.upsert({
    _id: 'system',
  }, {
    $set: {
      username: 'system',
      profile: {},
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
    $unset: {
      services: true,
      emails: true,
    },
  });
});

export async function getUserDefaultProfile(userId: string): Promise<string> {

  // Maybe the user already has a personal profile and we can return that.
  const existingProfile = ProfilesCollection.findOne({
    members: { $elemMatch: {
      basicRole: 'Owner',
      userId: userId,
    } },
  });
  if (existingProfile) {
    console.log('existing profile for', userId);
    return existingProfile._id;
  }
  console.log('new profile for', userId);

  // Register an empty profile
  const profileId = ProfilesCollection.insert({
    createdAt: new Date(),
    description: 'My First Profile',
    members: [],
    layers: [],
  });

  // Add some catalog space
  const userdataCatalogId = CatalogsCollection.insert({
    createdAt: new Date(),
    description: `Default userdata catalog for ${profileId}`,
    accessRules: [{
      mode: 'ReadWrite',
      subject: `local-profile:${profileId}`,
    }],
    apiFilters: [{}],
  });
  const sessionsCatalogId = CatalogsCollection.insert({
    createdAt: new Date(),
    description: `Default sessions catalog for ${profileId}`,
    accessRules: [{
      mode: 'ReadWrite',
      subject: `local-profile:${profileId}`,
    }],
    apiFilters: [{
      apiGroup: 'profile.dist.app',
    }],
  });

  ProfilesCollection.update({
    _id: profileId,
  }, {
    $push: {
      layers: { $each: [{
        // namespace: 'runtime',
        backingUrl: `local-catalog:${sessionsCatalogId}`,
        apiFilters: [{
          apiGroup: 'profile.dist.app',
        }],
      }, {
        // namespace: 'userdata',
        backingUrl: `local-catalog:${userdataCatalogId}`,
        apiFilters: [],
      // }, {
      //   // namespace: 'system',
      //   backingUrl: `local-catalog:system`,
      //   apiFilters: [],
      }]},
    },
  });

  // // Add a default workspace
  // EntitiesCollection.insert({
  //   catalogId: sessionsCatalogId,
  //   ...(<WorkspaceEntity>{
  //     apiVersion: 'runtime.dist.app/v1alpha1',
  //     kind: 'Workspace',
  //     metadata: {
  //       name: 'first-workspace',
  //       namespace: 'default',
  //     },
  //     spec: {
  //       windowOrder: [],
  //     },
  //   })});

  // Install the welcome app
  EntitiesCollection.insert({
    catalogId: sessionsCatalogId,
    ...(<AppInstallationEntity>{
      apiVersion: 'profile.dist.app/v1alpha1',
      kind: 'AppInstallation',
      metadata: {
        name: 'welcome',
        namespace: 'default',
      },
      spec: {
        appUri: 'bundled:'+encodeURIComponent('app:welcome'), // TODO: rename to appRef
        launcherIcons: [{
          action: 'app.dist.Main',
        }],
        preferences: {},
      },
    })});

  // TODO: pre-launch the welcome app

  // With everything ready, we provision and return the profile
  ProfilesCollection.update({
    _id: profileId,
  }, {
    $push: {
      members: {
        basicRole: 'Owner',
        userId: userId,
      },
    },
  });
  return profileId;
}
