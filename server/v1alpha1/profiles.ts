import { Meteor } from "meteor/meteor";

import { CatalogsCollection } from "/imports/db/catalogs";
import { EntitiesCollection } from "/imports/db/entities";
import { ProfilesCollection } from "/imports/db/profiles";
import { GuestCatalogs } from "/imports/engine/StaticCatalogs";
import { AppInstallationEntity } from "/imports/entities/profile";
import { Log } from "/imports/lib/logging";

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

  await ProfilesCollection.removeAsync({
    _id: 'login',
  });
  await CatalogsCollection.removeAsync({
    _id: 'login-profile',
  });
  await EntitiesCollection.removeAsync({
    catalogId: 'login-profile',
  });

  await createLoginProfile();
});

// TODO: the profile seeding should be refactored to use an EntityEngine

export async function getUserDefaultProfile(userId: string): Promise<string> {

  // Maybe the user already has a personal profile and we can return that.
  const existingProfile = ProfilesCollection.findOne({
    members: { $elemMatch: {
      basicRole: 'Owner',
      userId: userId,
    } },
  });
  if (existingProfile) {
    Log.info(`existing profile for ${userId}`);
    return existingProfile._id;
  }
  Log.info(`new profile for ${userId}`);

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

  // Install the default apps
  for (const defaultNamespace of GuestCatalogs) {
    if (!defaultNamespace.startsWith('app:')) continue;
    EntitiesCollection.insert({
      catalogId: sessionsCatalogId,
      ...(<AppInstallationEntity>{
        apiVersion: 'profile.dist.app/v1alpha1',
        kind: 'AppInstallation',
        metadata: {
          name: defaultNamespace,
        },
        spec: {
          appUri: 'bundled:'+encodeURIComponent(defaultNamespace), // TODO: rename to appRef
          launcherIcons: [{
            action: 'app.dist.Main',
          }],
          preferences: {},
        },
      })});
  }

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

async function createLoginProfile() {
  // Register an empty profile
  const profileId = ProfilesCollection.insert({
    _id: 'login',
    createdAt: new Date(),
    description: 'System Login',
    members: [{
      basicRole: 'Owner',
      userId: 'system',
    }],
    layers: [],
  });

  // Add some catalog space
  // const userdataCatalogId = CatalogsCollection.insert({
  //   _id: 'login-profile',
  //   createdAt: new Date(),
  //   description: `Default userdata catalog for ${profileId}`,
  //   accessRules: [{
  //     mode: 'ReadWrite',
  //     subject: `local-profile:${profileId}`,
  //   }],
  //   apiFilters: [{}],
  // });
  const sessionsCatalogId = CatalogsCollection.insert({
    _id: 'login-profile',
    createdAt: new Date(),
    description: `Default sessions catalog for ${profileId}`,
    accessRules: [{
      mode: 'ReadOnly',
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
      // }, {
        // namespace: 'userdata',
        // backingUrl: `local-catalog:${userdataCatalogId}`,
        // apiFilters: [],
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

  // Install the default apps
  for (const defaultNamespace of GuestCatalogs) {
    if (!defaultNamespace.startsWith('app:')) continue;
    EntitiesCollection.insert({
      catalogId: sessionsCatalogId,
      ...(<AppInstallationEntity>{
        apiVersion: 'profile.dist.app/v1alpha1',
        kind: 'AppInstallation',
        metadata: {
          name: defaultNamespace,
        },
        spec: {
          appUri: 'bundled:'+encodeURIComponent(defaultNamespace), // TODO: rename to appRef
          launcherIcons: [{
            action: 'app.dist.Main',
          }],
          preferences: {},
        },
      })});
  }

  // TODO: pre-launch the welcome app

  return profileId;
}
