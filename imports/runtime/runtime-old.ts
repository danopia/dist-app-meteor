import { EntitiesCollection } from "../db/entities";
import { AsyncCache } from "./async-cache";

export class Sandbox {
  namespaces = new Map<string, unknown>();
  // instances = new Map<string, unknown>();
  instanceCache = new AsyncCache({
    loadFunc: (key: string) => this._loadInstance(key),
  });

  constructor() {
    // const
  }
  // static async launch(domain: string) {
  //   // const
  // }

  async getInstance(namespace: string, api: string, kind: string, name: string) {
    const id = `${kind}.${api}:${namespace}/${name}`;
    return await this.instanceCache.get(id);
  }

  async _loadInstance(id: string): Promise<Instance> {
    // const id = `${kind}.${api}:${namespace}/${name}`;
    const item = EntitiesCollection.findOne({ _id: id });
    if (!item) throw new Error(`Missing ${id}`);
    switch (item?.kind) {
      case 'Activity':
        return { type: 'activity' };
      case 'Namespace':
        return { type: 'namespace' };
    }
  }
}

export type Instance =
| {
    type: 'namespace',
  }
| {
    type: 'activity',
  }
;
