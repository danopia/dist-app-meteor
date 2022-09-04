import { EntityMetadata } from "./core";

export interface WorkspaceEntity {
  _id?: string;
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "Workspace";
  metadata: EntityMetadata;
  spec: {
    windowOrder: Array<string>;
  };
}

export interface CommandEntity {
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "Command";
  metadata: EntityMetadata;
  spec: {
    type: 'launch-intent';
    intent: {
      // In sync with protocol.ts
      action?: string;
      catagory?: string;
      data?: string;
      activity?: {
        name: string;
      };
      flags?: Array<'new-task'>;
    };
  } | {
    type: 'bring-to-top' | 'close-task' | 'delete-task';
  } | {
    type: 'resize-window' | 'move-window';
    xAxis: number;
    yAxis: number;
  } | {
    type: 'set-task-rollup';
    state: 'normal' | 'rolled' | 'toggle';
  };
}

export interface TaskEntity {
  _id?: string;
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "Task";
  metadata: EntityMetadata;
  spec: {
    placement: {
      current: 'floating' | 'grid';
      rolledWindow: boolean;
      floating: {
        left: number;
        top: number;
        width: number;
        height: number;
      };
      grid: {
        area: 'fullscreen';
      };
    };
    stack: Array<{
      activityInstance: string;
    }>;
  };
}
export interface ActivityInstanceEntity {
  _id?: string;
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "ActivityInstance";
  metadata: EntityMetadata;
  spec: {
    activity: {
      // group?: string; // "dist.app"
      // kind: string; // "Asset"
      catalogId?: string;
      namespace?: string;
      name: string;
    };
    appState?: Record<string, string>;
  };
}

export type RuntimeEntity = (
  | WorkspaceEntity
  | CommandEntity
  | TaskEntity
  | ActivityInstanceEntity
);
