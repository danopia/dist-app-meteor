export interface EntityMetadata {
  name: string;
  namespace?: string;
  catalogId?: string;
  uid?: string;
  generation?: number;
  creationTimestamp?: Date;
  updateTimestamp?: Date;
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
  spec: {
    layers: Array<{
      mode: 'ReadOnly' | 'ReadWrite' | 'WriteOnly';
      accept: Array<{
        apiGroup?: string;
        apiVersion?: string;
        kind?: string;
      }>;
      storage: {
        type: 'local-inmemory';
      } | {
        type: 'bundled';
        bundleId: string;
      } | {
        type: 'profile';
        profileId: string;
      } | {
        type: 'foreign-ddp';
        remoteUrl: string;
        catalogId: string;
      };
    }>;

    // e.g. 'manifest.dist.app'
    // apis: Record<string, {

    // }>;
  };
  // spec: {};
}

export interface ArbitraryEntity {
  _id?: string;
  apiVersion: string;
  kind: string;
  metadata: EntityMetadata;
}

export type StreamEvent<T extends ArbitraryEntity> =
  | {
    kind:
      | 'InSync'
      | 'OutOfSync'
      | 'Bookmark'
    ;
  }
  | {
    kind:
      | 'Creation'
      | 'Mutation'
      | 'Deletion'
    ;
    snapshot: T;
  }
  | {
    kind: 'Error';
    message: string;
  }
;
