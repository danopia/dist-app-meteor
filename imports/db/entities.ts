export interface EntityMetadata {
  name: string;
  namespace?: string;
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
}

export interface NamespaceEntity {
  _id?: string;
  apiVersion: "core/v1";
  kind: "Namespace";
  metadata: EntityMetadata;
  // spec: {};
}

export interface FrameActivitySpec {
  type: "frame";
  urlPatterns: Array<string>;
  frame: {
    sourceUrl: string;
    messaging: "none" | "v1beta1";
  };
}
export interface ActivityEntity {
  _id?: string;
  apiVersion: "dist.app/v1alpha1";
  kind: "Activity";
  metadata: EntityMetadata;
  spec:
    | FrameActivitySpec
  ;
}

export interface FetchEndpointSpec {
  type: 'fetch';
  target: {
    type: 'internet';
  } | {
    type: 'endpoint';
    endpointChoices: Array<{
      name: string;
      url: string;
    }>;
    // schema?: {
    //   type: 'openapi';
    //   url: string;
    // };
    // auth?: {
    //   type: 'static-headers' | 'dynamic-headers' | 'request-signing';
    // };
  };
  allowedUrlPatterns: Array<string>;
  allowedRequestHeaders: Array<string>;
}
export interface EndpointEntity {
  _id?: string;
  apiVersion: "dist.app/v1alpha1";
  kind: "Endpoint";
  metadata: EntityMetadata;
  spec:
    | FetchEndpointSpec
  ;
}

export type Entity = (
  | NamespaceEntity
  | ActivityEntity
  | EndpointEntity
  // | ServiceEntity
  // | DatabaseEntity
);


import { Mongo } from 'meteor/mongo';
export const EntitiesCollection = new Mongo.Collection<{_id: string} & Entity>('Entities');
