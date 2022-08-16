import { NamespaceEntity } from "./core";
import { ManifestEntity } from "./manifest";
import { RuntimeEntity } from "./runtime";

export type Entity = (
  | NamespaceEntity
  | ManifestEntity
  | RuntimeEntity
);
