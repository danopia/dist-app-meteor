import { Tracker } from "meteor/tracker";
import { ArbitraryEntity } from "../entities/core";
import { EntityEngine } from "./EntityEngine";
import { LogicTracer } from "../lib/tracing";

const tracer = new LogicTracer({
  name: 'dist.app/EntityHandle',
});

export class EntityHandle<Tself extends ArbitraryEntity> {
  constructor(
    private readonly engine: EntityEngine,
    public readonly coords: {
      apiVersion: Tself["apiVersion"],
      apiKind: Tself["kind"],
      namespace: string;
      name: string;
    },
  ) {
    // this.snapshot = engine.getEntity<Tself>(coords.apiVersion, coords.apiKind, coords.namespace, coords.name);
  }
  // snapshot: Tself | null;

  getNeighborHandle<Tother extends ArbitraryEntity>(
    apiVersion: Tother["apiVersion"],
    apiKind: Tother["kind"],
    name: string,
  ): EntityHandle<Tother> {
    return this.engine.getEntityHandle<Tother>(
      apiVersion, apiKind,
      this.coords.namespace, name);
  }

  listNeighbors<Tother extends ArbitraryEntity>(
    apiVersion: Tother["apiVersion"],
    apiKind: Tother["kind"],
  ): Array<{
    entity: Tother;
    handle: EntityHandle<Tother>;
  }> {
    return this.engine.listEntities<Tother>(
      apiVersion, apiKind,
      this.coords.namespace).map(entity => ({
        entity,
        handle: this.getNeighborHandle<Tother>(apiVersion, apiKind, entity.metadata.name),
      }));
  }

  get() {
    return this.engine.getEntity<Tself>(
      this.coords.apiVersion, this.coords.apiKind,
      this.coords.namespace, this.coords.name);
  }

  /** Tracker-Fenced alternative to get() which waits for a resource to show up */
  @tracer.InternalSpan
  getAsync(signal?: AbortSignal) {
    const initial = this.get();
    if (initial) return Promise.resolve(initial);
    signal?.throwIfAborted();
    return new Promise<Tself>((ok, reject) => {
      const computation = Tracker.autorun(computation => {
        const snapshot = this.get();
        if (snapshot) {
          ok(snapshot);
          computation.stop();
        }
      });
      signal?.addEventListener('abort', event => {
        reject(new Error(`getAsync aborted: ${event}`));
        computation.stop();
      });
    })
  }

  async insertNeighbor<Tother extends ArbitraryEntity>(
    neighbor: Tother,
  ) {
    await this.engine.insertEntity<Tother>({
      ...neighbor,
      metadata: {
        ...neighbor.metadata,
        namespace: this.coords.namespace,
      },
    });

    return this.getNeighborHandle<Tother>(
      neighbor.apiVersion, neighbor.kind,
      neighbor.metadata.name);
  }

  async mutate(mutationCb: (x: Tself) => void | symbol) {
    return await this.engine.mutateEntity<Tself>(
      this.coords.apiVersion, this.coords.apiKind,
      this.coords.namespace, this.coords.name,
      mutationCb);
  }

  async delete() {
    return await this.engine.deleteEntity<Tself>(
      this.coords.apiVersion, this.coords.apiKind,
      this.coords.namespace, this.coords.name);
  }

  /** @deprecated @todo Should return a further EntityHandle instead of raw entity */
  followOwnerReference<Towner extends ArbitraryEntity>(
    apiVersion: Towner["apiVersion"],
    apiKind: Towner["kind"],
  ): Towner | null {
    const snapshot = this.get();

    const ownerName = snapshot?.metadata.ownerReferences
      ?.find(x => x.apiVersion == apiVersion && x.kind == apiKind)?.name;
    if (!ownerName) return null;

    return this.engine.getEntity<Towner>(apiVersion, apiKind, this.coords.namespace, ownerName);
  }
}
