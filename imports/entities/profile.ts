import { EntityMetadata } from "./core";

export interface AppInstallationEntity {
  _id?: string;
  apiVersion: "profile.dist.app/v1alpha1";
  kind: "AppInstallation";
  metadata: EntityMetadata;
  spec: {
    appUri: string;
    // isInLauncher: boolean;
    launcherIcons: Array<{
      action: string;
    }>;
    preferences: Record<string, unknown>;
  };
}

export interface ApiCredentialEntity {
  _id?: string;
  apiVersion: "profile.dist.app/v1alpha1";
  kind: "ApiCredential";
  metadata: EntityMetadata;
  spec: {
    accountTypeId: string;
    authType: 'http-basic' | 'http-digest' | 'api-key' | 'oauth2' | 'oidc';
    exit: {
      type: 'internet';
      targetUrl?: string;
      corsAllowed?: boolean;
    };
    restrictions: {
      keepOnServer?: boolean;
      blockExport?: boolean;
    };
    exportable?: boolean;
    validation: 'None' | 'CheckOnly' | 'Enforced';
    logging: 'None' | 'MetadataOnly' | 'Full';
  };
  status?: {
    lifecycle: 'Pending' | 'Available' | 'Expired';
    health: 'Unknown' | 'Passing' | 'Failed';
    validUntil?: Date;
  };
  secret?: {
    username?: string;
    password?: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

// export interface TaskEntity {
//   _id?: string;
//   apiVersion: "profile.dist.app/v1alpha1";
//   kind: "Task";
//   metadata: EntityMetadata;
//   spec: {
//     appName: string;
//     appState?: Record<string, string>;
//   };
// }

export interface SavedSessionEntity {
  _id?: string;
  apiVersion: "profile.dist.app/v1alpha1";
  kind: "SavedSession";
  metadata: EntityMetadata;
  spec: {
    // openWindows: number;
    jsonEntities: Array<string>;
  };
}

export interface EntityCatalogEntity {
  _id?: string;
  apiVersion: "profile.dist.app/v1alpha1";
  kind: "EntityCatalog";
  metadata: EntityMetadata;
  spec: {
    appUri: string;
    apiGroup: string;
    // readAccess: 'Private' | 'Unlisted' | 'Public';
  };
  status?: {
    catalogId: string;
  };
};

export type RuntimeEntity = (
  | AppInstallationEntity
  | ApiCredentialEntity
  // | TaskEntity
  | SavedSessionEntity
  | EntityCatalogEntity
);
