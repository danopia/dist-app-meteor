import { Meteor } from "meteor/meteor";
import { EntitiesCollection } from "/imports/db/entities";
import { EntityCatalogEntity } from "/imports/entities/profile";
import { CatalogsCollection } from "/imports/db/catalogs";
import { ProfilesCollection } from "/imports/db/profiles";

async function updateUsages() {
  const byCatalogId = new Map<string, {
    entities: number;
    bytes: number;
  }>();

  for await (const entity of EntitiesCollection.find()) {
    let catalogTallies = byCatalogId.get(entity.catalogId);
    if (!catalogTallies) {
      catalogTallies = {
        entities: 0,
        bytes: 0,
      };
      byCatalogId.set(entity.catalogId, catalogTallies);
    }

    catalogTallies.entities += 1;
    catalogTallies.bytes += JSON.stringify(entity).length;
  }

  for (const [key, value] of byCatalogId) {
    await CatalogsCollection.updateAsync({
      _id: key,
    }, {
      $set: {
        usage: value,
      },
    });
  }
  await CatalogsCollection.updateAsync({
    _id: { $nin: [...byCatalogId.keys()] },
  }, {
    $set: {
      usage: {
        entities: 0,
        bytes: 0,
      },
    },
  });
  console.log(`Counted entities for ${byCatalogId.size} catalogs`);
}
// TODO: tracing:
Meteor.setTimeout(updateUsages, 30 * 1000);
Meteor.setInterval(updateUsages, 60 * 5 * 1000);

EntitiesCollection.find({
  apiVersion: 'profile.dist.app/v1alpha1',
  kind: 'EntityCatalog',
  'status.catalogId': { $exists: false },
}).observe({
  async added(doc) {
    const entity = doc as unknown as EntityCatalogEntity;

    const parentCatalog = await CatalogsCollection.findOneAsync({
      _id: doc.catalogId,
    });
    if (!parentCatalog) throw new Meteor.Error(`missing`, `No parent catalog found`);

    // TODO: this is some crappy authentication tbh
    const profile = await ProfilesCollection.findOneAsync({
      _id: parentCatalog.accessRules.find(x => x.mode == 'ReadWrite')?.subject.split(':')[1],
    });
    if (!profile) throw new Meteor.Error(`missing`, `No owning profilefound`);

    // Add some catalog space
    const sessionsCatalogId = await CatalogsCollection.insertAsync({
      createdAt: new Date(),
      description: `App catalog storing ${entity.spec.apiGroup} from ${entity.spec.appUri} for ${entity.metadata.name}`,
      accessRules: [{
        mode: 'ReadWrite',
        subject: `local-profile:${profile._id}`,
      }],
      apiFilters: [{
        apiGroup: entity.spec.apiGroup,
      }],
    });

    // Record the catalog onto the status
    entity.status = {
      catalogId: sessionsCatalogId,
    };
    await EntitiesCollection.updateAsync({
      _id: doc._id,
    }, {
      $set: {
        status: entity.status,
      },
    }, { multi: false });

  // ProfilesCollection.update({
  //   _id: profileId,
  // }, {
  //   $push: {
  //     layers: { $each: [{
  //       // namespace: 'runtime',
  //       backingUrl: `local-catalog:${sessionsCatalogId}`,
  //       apiFilters: [{
  //         apiGroup: 'profile.dist.app',
  //       }],
  //     }, {
  //       // namespace: 'userdata',
  //       backingUrl: `local-catalog:${userdataCatalogId}`,
  //       apiFilters: [],
  //     // }, {
  //     //   // namespace: 'system',
  //     //   backingUrl: `local-catalog:system`,
  //     //   apiFilters: [],
  //     }]},
  //   },
  // });

  },
});
