export interface EntityMetadata {
  name: string;
  namespace?: string;
  catalogId?: string;
  uid?: string;
  generation?: number;
  title?: string;
  description?: string;
  labels?: Record<string,string|undefined>;
  annotations?: Record<string,string|undefined>;
  tags?: Array<string>;
  links?: Array<{
    url: string;
    title?: string;
    icon?: string;
    type?: string;
  }>;
  ownerReferences?: Array<{
    apiVersion: string;
    kind: string;
    name: string;
    uid?: string; // this is required in kubernetes
    blockOwnerDeletion?: boolean;
    controller?: boolean;
  }>;
}

export interface NamespaceEntity {
  _id?: string;
  apiVersion: "core/v1";
  kind: "Namespace";
  metadata: EntityMetadata;
  // spec: {};
}

export interface ArbitraryEntity {
  _id?: string;
  apiVersion: string;
  kind: string;
  metadata: EntityMetadata;
}
