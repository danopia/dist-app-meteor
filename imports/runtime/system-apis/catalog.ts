import { Meteor } from "meteor/meteor";
import { navigate } from "raviger";

import type { FetchRpcHandler } from "/imports/runtime/FetchRpcHandler";
import type { SavedSessionEntity } from "/imports/entities/profile";
import type { FetchRequestEntity, FetchResponseEntity } from "/imports/entities/protocol";

/**
 * # catalog.v1alpha1.dist.app
 *
 * This API is used by:
 *   - kube-dash (bundled app)
 *       Used to interact with the
 */
export async function serveCatalogApi(rpc: {
  request: FetchRequestEntity['spec'];
  path: string;
  context: FetchRpcHandler;
}): Promise<FetchResponseEntity['spec']> {

  {
    const match = new URLPattern({pathname: '/my-namespace/apis/:apiGroup/:apiVersion/:kind'}).exec(new URL('/'+rpc.path, 'http://null'));
    if (match && rpc.request.method == 'GET') {
      const {apiGroup, apiVersion, kind} = match.pathname.groups;
      const resources = rpc.context.runtime.listEntities(`${apiGroup}/${apiVersion}`, kind!, rpc.context.activityTask.metadata.namespace);
      return {
        status: 200,
        headers: [['content-type', 'application/json']],
        body: JSON.stringify({items: resources}),
      };
    }
  }

  {
    const match = new URLPattern({pathname: '/my-namespace/apis/:apiGroup/:apiVersion/:kind/:name'}).exec(new URL('/'+rpc.path, 'http://null'));
    if (match && rpc.request.method == 'POST' && rpc.request.headers?.find(x => x[0] == 'content-type')?.[1] == 'application/apply-patch+json') {
      const {apiGroup, apiVersion, kind, name} = match.pathname.groups;
      const entityJson = JSON.parse(`${rpc.request.body}`);
      console.log({apiGroup, apiVersion, kind, name,entityJson})
      const hEntity = rpc.context.runtime.getEntityHandle(`${apiGroup}/${apiVersion}`, kind!, rpc.context.activityTask.metadata.namespace!, name);
      if (hEntity.get()) {
        await hEntity.mutate(entity => {
          console.log('TODO: i have', {entity}, 'and want to apply', entityJson);
          // TODO: this is terrible!
          entity.spec = entityJson.spec;
        });
      } else {
        await hEntity.insertNeighbor({
          ...entityJson,
          apiVersion: `${apiGroup}/${apiVersion}`,
          kind: kind!,
          metadata: {
            ...entityJson.metadata,
            name: name!,
          }
        });
      }
      // const resources = rpc.context.runtime.listEntities(`${apiGroup}/${apiVersion}`, kind!, rpc.context.activityTask.metadata.namespace);
      return {
        status: 204,
      };
    }
  }

  {
    const match = new URLPattern({pathname: '/my-namespace/create-entity'}).exec(new URL('/'+rpc.path, 'http://null'));
    if (match && rpc.request.method == 'POST') {
      const {apiGroup, apiVersion, kind} = match.pathname.groups;
      const entityJson = rpc.request.body;
      console.log({entityJson})
      throw new Error(`TODO: insert`);
      // const resources = rpc.context.runtime.insertEntity({

      // }`${apiGroup}/${apiVersion}`, kind!, rpc.context.activityTask.metadata.namespace);
      // return {
      //   status: 200,
      //   headers: [['content-type', 'application/json']],
      //   body: JSON.stringify({items: resources}),
      // };
    }
  }

  return {
    status: 420,
    headers: [['content-type', 'text/plain']],
    body: 'sober up and implement this',
  };
}
