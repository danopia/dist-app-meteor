//@ts-expect-error .ts file extension
import { EntityMetadata } from "./core.ts";

export interface RestConnectionEntity {
  apiVersion: 'manifest-runtime.dist.app/v1alpha1';
  kind: 'RestConnection';
  metadata: EntityMetadata;
  spec: {
    apiName: string;
    authentication?: {
      requestSecuritySchemes: Array<string>;
    };
  };
  status?: {
    selectedEndpoint?: string;
    exitLocation?: 'Browser' | 'Server';
    permissionGrantName?: string;
  };
}

export interface RestCallEntity {
  apiVersion: 'manifest-runtime.dist.app/v1alpha1';
  kind: 'RestCall';
  metadata: EntityMetadata;
  spec: {
    restConnectionName: string;
    operationId: string;
    parameters: Record<string,unknown>,
  };
  status?: {
    phase:
      | 'Queued'
      | 'Inflight'
      | 'Failed'
      | 'Completed'
      ;
    sentAt?: Date;
    error?: {
      code: string;
      message: string;
    };
    response?: {
      statusCode: number;
      contentType?: string;
      data: Uint8Array | string;
    };
  };
}

export type ManifestRuntimeEntity = (
  | RestConnectionEntity
  | RestCallEntity
);
