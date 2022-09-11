import { ArbitraryEntity } from "../entities/core";
import { EntityEngine } from "./EntityEngine";

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

  get() {
    return this.engine.getEntity<Tself>(
      this.coords.apiVersion, this.coords.apiKind,
      this.coords.namespace, this.coords.name);
  }

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
