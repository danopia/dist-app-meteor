import { EntityMetadata } from "./core";

export interface LifecycleEntity {
  apiVersion?: "protocol.dist.app/v1alpha1";
  kind: "Lifecycle";
  metadata?: EntityMetadata;
  spec: {
    stage: 'ready' | 'recycle';
  };
}

export interface LaunchIntentEntity {
  apiVersion?: "protocol.dist.app/v1alpha1";
  kind: "LaunchIntent";
  metadata?: EntityMetadata;
  spec: {
    // In sync with runtime.ts
    action?: string;
    category?: string;
    receiverRef?: string;
    data?: string;
    // activity?: {
    //   name: string;
    // };
    flags?: Array<'new-task'>;
  };
}

export interface WriteDebugEventEntity {
  apiVersion?: "protocol.dist.app/v1alpha1";
  kind: "WriteDebugEvent";
  metadata?: EntityMetadata;
  spec: {
    timestamp: Date;
    level: string; // debug, info, warn, error
    text: string;
    error?: {
      name: string;
      message: string;
      stack?: string;
    };
  };
}

export interface FetchRequestEntity {
  apiVersion?: "protocol.dist.app/v1alpha1";
  kind: "FetchRequest";
  metadata?: EntityMetadata;
  id: number;
  spec: {
    method: string;
    url: string;
    headers?: Array<[string, string]>;
    body?: string | Uint8Array;
    bodyStream?: boolean;
  };
}
export interface FetchResponseEntity {
  apiVersion?: "protocol.dist.app/v1alpha1";
  kind: "FetchResponse";
  metadata?: EntityMetadata;
  origId: number;
  spec: {
    status: number;
    headers?: Array<[string, string]>;
    remoteAddress?: string;
    body?: string | Uint8Array;
    bodyStream?: boolean;
    timing?: {
      startedAt: Date;
      connectMillis?: number;
      firstByteMillis: number;
      completedMillis: number;
    };
  };
}
export interface FetchBodyChunkEntity {
  apiVersion?: "protocol.dist.app/v1alpha1";
  kind: "FetchBodyChunk";
  metadata?: EntityMetadata;
  origId: number;
  spec: {
    chunk: string | Uint8Array;
    isFinal: boolean;
  };
}
export interface FetchErrorEntity {
  apiVersion?: "protocol.dist.app/v1alpha1";
  kind: "FetchError";
  metadata?: EntityMetadata;
  origId: number;
  spec: {
    message: string;
  };
}

export type ProtocolEntity = (
  | LifecycleEntity
  | LaunchIntentEntity
  | WriteDebugEventEntity
  | FetchRequestEntity
  | FetchResponseEntity
  | FetchBodyChunkEntity
  | FetchErrorEntity
);
