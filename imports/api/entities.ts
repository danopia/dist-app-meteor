export interface EntityMetadata {
  name: string;
  namespace?: string;
  catalogId?: string;
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

export interface TaskEntity {
  _id?: string;
  apiVersion: "dist.app/v1alpha1";
  kind: "Task";
  metadata: EntityMetadata;
  spec: {
    placement: {
      type: 'floating';
      left: number;
      top: number;
      width: number;
      height: number;
    } | {
      type: 'grid';
      area: 'fullscreen';
    };
    stack: Array<{
      activity: {
        // group?: string; // "dist.app"
        // kind: string; // "Asset"
        catalogId?: string;
        namespace?: string;
        name: string;
      };
    }>;
  };
}

export interface ApplicationEntity {
  _id?: string;
  apiVersion: "dist.app/v1alpha1";
  kind: "Application";
  metadata: EntityMetadata;
  spec: {
    icon?: IconSpec;
  };
}

export interface GlyphIconSpec {
  type: 'glyph',
  glyph: {
    text: string;
    foregroundColor?: string;
    backgroundColor: string,
  };
}
export interface ImageIconSpec {
  type: 'image';
  image: {
    group?: string; // "dist.app"
    kind: string; // "Asset"
    namespace?: string;
    name: string;
  };
};
export type IconSpec =
| GlyphIconSpec
| ImageIconSpec
;

export interface IframeImplementationSpec {
  type: 'iframe',
  sandboxing?: Array<'allow-scripts'>;
  source: {
    type: 'internet-url';
    url: string;
  } | {
    type: 'piecemeal';
    htmlLang?: string;
    metaCharset?: string;
    headTitle?: string;
    scriptUrls?: Array<string>;
    inlineScript?: string;
    bodyHtml?: string;
  };
}
export type ImplementationSpec =
| IframeImplementationSpec
;

export interface ActivityEntity {
  _id?: string;
  apiVersion: "dist.app/v1alpha1";
  kind: "Activity";
  metadata: EntityMetadata;
  spec: {
    icon?: IconSpec;
    intentFilters?: Array<{
      action: 'app.dist.Main',
      category: 'app.dist.Launcher',
    }>;
    implementation: ImplementationSpec;
    // launchMode:
    //   | "Standard"
    //   | "SingleTop"
    //   | "SingleTask"
    //   | "SingleInstance"
    //   ;
  };
}

// export interface IFrameEmbedEntity {
//   _id?: string;
//   apiVersion: "dist.app/v1alpha1";
//   kind: "Activity";
//   type: "frame";
//   urlPatterns: Array<string>;
//   frame: {
//     sourceUrl: string;
//     messaging: "none" | "v1beta1";
//   };
// }

// export interface FetchEndpointSpec {
//   type: 'fetch';
//   target: {
//     type: 'internet';
//   } | {
//     type: 'endpoint';
//     endpointChoices: Array<{
//       name: string;
//       url: string;
//     }>;
//     // schema?: {
//     //   type: 'openapi';
//     //   url: string;
//     // };
//     // auth?: {
//     //   type: 'static-headers' | 'dynamic-headers' | 'request-signing';
//     // };
//   };
//   allowedUrlPatterns: Array<string>;
//   allowedRequestHeaders: Array<string>;
// }
// export interface EndpointEntity {
//   _id?: string;
//   apiVersion: "dist.app/v1alpha1";
//   kind: "Endpoint";
//   metadata: EntityMetadata;
//   spec:
//     | FetchEndpointSpec
//   ;
// }

export type Entity = (
  | NamespaceEntity
  | TaskEntity
  | ApplicationEntity
  | ActivityEntity
  // | EndpointEntity
  // | ServiceEntity
  // | DatabaseEntity
);
