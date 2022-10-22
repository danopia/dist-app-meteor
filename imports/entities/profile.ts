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

export interface FetchBindingEntity {
  _id?: string;
  apiVersion: "profile.dist.app/v1alpha1";
  kind: "FetchBinding";
  metadata: EntityMetadata;
  spec: {
    exit: {
      type: 'Internet';
      targetUrl: string;
      corsAllowed?: boolean;
    };
    validation: 'None' | 'CheckOnly' | 'Enforced';
    logging: 'None' | 'MetadataOnly' | 'Full';
  };
  secret?: {
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
  id?: string;
  apiVersion: "profile.dist.app/v1alpha1";
  kind: "SavedSession";
  metadata: EntityMetadata;
  spec: {
    // openWindows: number;
    jsonEntities: Array<string>;
  };
}

export type RuntimeEntity = (
  | AppInstallationEntity
  | FetchBindingEntity
  | TaskEntity
  | SavedSessionEntity
);
