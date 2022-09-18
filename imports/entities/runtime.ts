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
      category?: string;
      receiverRef?: string;
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

export interface FrameEntity {
  _id?: string;
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "Frame";
  metadata: EntityMetadata;
  spec: {
    contentRef: string;
  // },
  // status: {
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
  };
}
export interface ActivityTaskEntity {
  _id?: string;
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "ActivityTask";
  metadata: EntityMetadata;
  spec: {
    // TODO: installationRef
    installationNamespace: string;
    installationName: string;
    activityName: string;
  };
  state: {
    appData?: Record<string, string>;
  }
}

export type RuntimeEntity = (
  | WorkspaceEntity
  | CommandEntity
  | FrameEntity
  | ActivityTaskEntity
);
