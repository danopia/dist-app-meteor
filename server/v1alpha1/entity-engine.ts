import { Meteor } from "meteor/meteor";
import { ProfilesCollection } from "/imports/db/profiles";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { AsyncCache } from "/imports/runtime/async-cache";

function makeEntityEngine(profileId: string) {
  const runtime = new EntityEngine();

  runtime.addNamespace({
    name: 'session',
    spec: {
      // TODO: replace the 'profile' layer with the proper stack of 'catalog' layers
      layers: [{
        mode: 'ReadWrite',
        accept: [{
          // apiGroup: 'profile.dist.app',
        }],
        storage: {
          type: 'profile',
          profileId: profileId,
        },
      }],
    }});

  return runtime;
}

async function createEntityEngineForUser(userId: string) {
  const existingProfile = await ProfilesCollection.findOneAsync({
    members: { $elemMatch: {
      basicRole: 'Owner',
      userId: userId,
    } },
  });

  if (!existingProfile) throw new Meteor.Error(`no-profile`,
    `Didn't find a profile owned by user ${JSON.stringify(userId)}`);

  return makeEntityEngine(existingProfile._id);
}

const EntityEngineCache = new AsyncCache({
  // keyFunc(key: ProfileDoc) {
  //   return key._id;
  // },
  loadFunc: async (x: string) => {
    return await createEntityEngineForUser(x);
  },
});

export async function getUserEngine(userId: string | null) {
  if (!userId) throw new Meteor.Error(`logged-out`,
    `You need to be logged in as a user to access profile APIs.`);
  return await EntityEngineCache.get(userId);
}
