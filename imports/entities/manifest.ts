import { EntityMetadata } from "./core";

export interface ApplicationEntity {
  _id?: string;
  apiVersion: "manifest.dist.app/v1alpha1";
  kind: "Application";
  metadata: EntityMetadata;
  spec: {
    icon?: IconSpec;
    brandImageUrl?: string;
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
export interface SvgIconSpec {
  type: 'svg',
  svg: {
    textData: string;
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
| SvgIconSpec
| ImageIconSpec
;

export interface IframeImplementationSpec {
  type: 'iframe',
  sandboxing?: Array<
    | 'allow-scripts'
    | 'allow-forms'
    | 'allow-popups'
    | 'allow-modals'
    | 'allow-same-origin'
  >;
  securityPolicy?: {
    scriptSrc?: Array<string>;
    imgSrc?: Array<string>;
    connectSrc?: Array<string>;
  };
  disableCommunication?: boolean;
  source: {
    type: 'internet-url';
    url: string;
  } | {
    type: 'piecemeal';
    htmlLang?: string;
    metaCharset?: string;
    headTitle?: string;
    importMap?: {
      imports: Record<string,string>;
    };
    scriptUrls?: Array<string>;
    inlineScript?: string;
    inlineStyle?: string;
    bodyHtml?: string;
  };
}
export interface IsolateImplementationSpec {
  type: 'isolate';
  engines: Record<string, string>; // e.g. v8, deno
  source: {
    type: 'internet-url';
    url: string;
  } | {
    type: 'inline-module';
    source: string;
  };
}
export type ImplementationSpec =
| IframeImplementationSpec
| IsolateImplementationSpec
;

export interface ActivityEntity {
  _id?: string;
  apiVersion: "manifest.dist.app/v1alpha1";
  kind: "Activity";
  metadata: EntityMetadata;
  spec: {
    icon?: IconSpec;
    intentFilters?: Array<{
      action: 'app.dist.Main';
      category: 'app.dist.Launcher';
    }>;
    implementation: ImplementationSpec;
    windowSizing?: {
      initialWidth: number;
      initialHeight: number;
      minWidth?: number;
      maxWidth?: number;
      minHeight?: number;
      maxHeight?: number;
    };
    // launchMode:
    //   | "Standard"
    //   | "SingleTop"
    //   | "SingleTask"
    //   | "SingleInstance"
    //   ;
  };
}

export interface FacilityEntity {
  _id?: string;
  apiVersion: "manifest.dist.app/v1alpha1";
  kind: "Facility";
  metadata: EntityMetadata;
  spec: {
    providesApis: Array<string>;
    implementation: ImplementationSpec;
  };
}

export interface ApiEntity {
  _id?: string;
  apiVersion: "manifest.dist.app/v1alpha1";
  kind: "Api";
  metadata: EntityMetadata;
  spec: {
    vendorDomain?: string;
    // endpoints: {}
    // schema: {
      type: "openapi";
      crossOriginResourceSharing?: 'restricted' | 'open';
      definition: string;
    // };
  };
}

export interface ApiBindingEntity {
  apiVersion: 'manifest.dist.app/v1alpha1';
  kind: 'ApiBinding';
  metadata: EntityMetadata;
  spec: {
    apiName: string;
    required: boolean;
    auth?: {
      required: boolean;
      accountTypeId: string;
    };
  };
}

export interface WebAccountTypeEntity {
  apiVersion: 'manifest.dist.app/v1alpha1';
  kind: 'WebAccountType';
  metadata: EntityMetadata;
  spec: {
    vendorDomain: string;
    credentialScheme: 'UsernameAndPassword' | 'OAuthToken' | 'ApiKeyOnly';
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

export type ManifestEntity = (
  | ApplicationEntity
  | ActivityEntity
  | ApiEntity
  | ApiBindingEntity
  | WebAccountTypeEntity
  // | EndpointEntity
  // | ServiceEntity
  // | DatabaseEntity
);
