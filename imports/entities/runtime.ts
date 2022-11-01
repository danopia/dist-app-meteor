import { EntityMetadata } from "./core";

export interface WorkspaceEntity {
  _id?: string;
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "Workspace";
  metadata: EntityMetadata;
  spec: {
    windowOrder: Array<string>;
    savedSessionName?: string;
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
      dataRef?: string;
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
  status?: {
    frameName?: string;
  };
}

export interface FrameEntity {
  _id?: string;
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "Frame";
  metadata: EntityMetadata;
  spec: {
    contentRef: string;
    sizeConstraint?: {
      minWidth?: number;
      maxWidth?: number;
      minHeight?: number;
      maxHeight?: number;
    };
  // },
  // status: {
    placement: {
      current: 'floating' | 'grid';
      rolledWindow: boolean;
      floating: {
        left: number;
        top: number;
        width?: number;
        height?: number;
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
