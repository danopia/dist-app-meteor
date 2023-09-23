import { EntityMetadata } from "./core";

/*
 * I intended these entities to be useful when
 * passing basic data thru the system in places that expect
 * more complicated data.
 */
// TODO: use these for something or drop them

export interface StringEntity {
  apiVersion?: "primitive.dist.app/v1alpha1";
  kind: "String";
  metadata?: EntityMetadata;
  spec: {
    data: string;
  };
}

export interface BinaryEntity {
  apiVersion?: "primitive.dist.app/v1alpha1";
  kind: "String";
  metadata?: EntityMetadata;
  spec: {
    data: Uint8Array; // this would typically be Base64'd
  };
}

export interface DateEntity {
  apiVersion?: "primitive.dist.app/v1alpha1";
  kind: "Date";
  metadata?: EntityMetadata;
  spec: {
    itemApiVersion: string;
    itemKind: string;
  }
}

export interface StringMapEntity {
  apiVersion?: "primitive.dist.app/v1alpha1";
  kind: "StringMap";
  metadata?: EntityMetadata;
  data: Record<string, string>;
}

export interface StringListEntity {
  apiVersion?: "primitive.dist.app/v1alpha1";
  kind: "StringList";
  metadata?: EntityMetadata;
  data: Array<string>;
}

export type PrimitiveEntity = (
  | StringEntity
  | BinaryEntity
  | DateEntity
  | StringMapEntity
  | StringListEntity
);
