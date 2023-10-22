import { EntityMetadata } from "./core.ts";

export interface WorkspaceEntity {
  _id?: string;
  apiVersion: "runtime.dist.app/v1alpha1";
  kind: "Workspace";
  metadata: EntityMetadata;
  spec: {
    frameMode?: 'windowing' | 'tabbed';
    windowOrder: Array<string>;
    savedSessionName?: string;
    layerRenderKey?: string;
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
      contextRef?: string;
      receiverRef?: string;
      dataRef?: string;
      data?: string;
      flags?: Array<'new-task'>;
      /** @deprecated @TODO not really sure what this will look like yet */
      extras?: {};
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
    outcome?: 'Completed' | 'Denied' | 'Failed';
    message?: string;
    resultRef?: string;
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
    intent?: (CommandEntity['spec'] & {type: 'launch-intent'})['intent'];
  };
  state: {
    appData?: Record<string, string>;
    caps?: Record<string, {
      type: 'HttpClient';
      // apiBindingName: string;
      baseUrl?: string;
      apiBindingRef?: string;
      apiCredentialRef?: string;
    }>;
  };
}

export type RuntimeEntity = (
  | WorkspaceEntity
  | CommandEntity
  | FrameEntity
  | ActivityTaskEntity
);
