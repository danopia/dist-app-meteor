import { Meteor } from "meteor/meteor";
import { CatalogsCollection } from "/imports/db/catalogs";

import { publishComposite } from 'meteor/reywood:publish-composite';
import { ProfilesCollection } from "/imports/db/profiles";
import { EntitiesCollection } from "/imports/db/entities";
import { check } from "meteor/check";

Meteor.publish('/v1alpha1/profiles/list', () => {
  const userId = Meteor.userId();
  if (!userId) return ProfilesCollection.find({ _id: 'login' });
  return ProfilesCollection.find({
    'members': { $elemMatch: {
      'basicRole': { $in: ['Owner', 'Editor', 'Viewer'] },
      'userId': userId,
    }},
  });
});

publishComposite('/v1alpha1/profiles/by-id/composite', (profileId) => ({
  find() {
    check(profileId, String);
    const userId = Meteor.userId();
    if (profileId == 'login') return CatalogsCollection.find({ _id: 'login-profile' });
    if (!userId) return CatalogsCollection.find({ _id: 'non-extant' });
    return CatalogsCollection.find({
      accessRules: { $elemMatch: {
        mode: { $in: ['ReadOnly', 'ReadWrite', 'WriteOnly'] },
        subject: `local-profile:${profileId}`,
      }},
    });
  },
  children: [{
    find: (catalog) => EntitiesCollection.find({
      catalogId: catalog._id,
    }, {
      fields: { secret: 0 },
    }),
  }],
}));

publishComposite('/v1alpha1/all-my-stuff', {
  find() {
    const userId = Meteor.userId();
    if (!userId) return ProfilesCollection.find({ _id: 'nonextant' });
    return ProfilesCollection.find({
      'members': { $elemMatch: {
        'basicRole': { $in: ['Owner', 'Editor', 'Viewer'] },
        'userId': userId,
      }},
    });
  },
  children: [{
    find(profile) {
      const memberIds = profile.members.map(x => x.userId);
      return Meteor.users.find({
        _id: { $in: memberIds },
      }, {
        fields: { profile: 1 },
      });
    },
  }, {
    find: (profile) => CatalogsCollection.find({
      accessRules: { $elemMatch: {
        // TODO: should affect entities publication:
        mode: { $in: ['ReadOnly', 'ReadWrite', 'WriteOnly'] },
        subject: `local-profile:${profile._id}`,
      }},
    }),
    children: [{
      find: (catalog) => EntitiesCollection.find({
        //@ts-expect-error typings not recursive enough
        catalogId: catalog._id,
      }, {
        fields: { secret: 0 },
      }),
    }],
  }],
});
