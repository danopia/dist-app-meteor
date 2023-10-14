import { Meteor } from "meteor/meteor";
import { settings } from "/imports/settings";
import { Log } from "/imports/lib/logging";
import { ProfileDoc, ProfilesCollection } from "/imports/db/profiles";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { startHttpClientOperator } from "/imports/runtime/system-controllers/http-client";
import { AbortController } from "node-abort-controller";
import { WritableStream } from "web-streams-polyfill/ponyfill";
import { EntityCatalogEntity } from "/imports/entities/profile";

class ProfileOperatorManager {
  abortController = new AbortController();
  constructor(
    readonly profileDoc: ProfileDoc,
  ) {
    const daemonSettings = settings.daemonProfiles?.find(x => x.profileId == profileDoc._id);
    const engine = new EntityEngine();

    engine.addNamespace({
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
            profileId: profileDoc._id,
          },
        }],
      }});

    engine.streamEntities<EntityCatalogEntity>(
      'profile.dist.app/v1alpha1', 'EntityCatalog',
      'session',
      this.abortController.signal,
    ).then(async x => {
      x.pipeTo(new WritableStream({
        write: (evt) => {
          if (!evt || evt.kind !== 'Creation') return;
          if (!evt.snapshot.status?.catalogId) return;

          if (evt.snapshot.spec.apiGroup == 'http-client.dist.app') {
            Log.info(`Starting http-client operator for catalog ${evt.snapshot.status.catalogId}`)
            engine.addNamespace({
              name: `cat-${evt.snapshot.metadata.name}`,
              spec: {
                layers: [{
                  mode: 'ReadWrite',
                  accept: [{
                    apiGroup: evt.snapshot.spec.apiGroup,
                  }],
                  storage: {
                    type: 'local-catalog',
                    catalogId: evt.snapshot.status.catalogId,
                  },
                }],
              },
            });
            startHttpClientOperator({
              engine,
              namespace: `cat-${evt.snapshot.metadata.name}`,
              signal: this.abortController.signal,
            });
          }
        },
      }));
    });

  }
}

const runningProfiles = new Map<string, ProfileOperatorManager>();

Meteor.startup(() => {
  if (!settings.daemonProfiles) return;
  ProfilesCollection.find({
    _id: { $in: settings.daemonProfiles?.map(x => x.profileId) ?? [] },
  }).observe({
    added(doc) {
      if (runningProfiles.has(doc._id)) return;
      runningProfiles.set(doc._id, new ProfileOperatorManager(doc));
    },
    removed(doc) {
      const known = runningProfiles.get(doc._id);
      known?.abortController.abort(new Error(`Profile is no longer schedulable`));
      runningProfiles.delete(doc._id);
    },
  });
});
