import { EntityMetadata } from "./core";

export interface ApplicationEntity {
  _id?: string;
  apiVersion: "manifest.dist.app/v1alpha1";
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
  sandboxing?: Array<'allow-scripts' | 'allow-forms' | 'allow-popups'>;
  securityPolicy?: {
    scriptSrc?: Array<string>;
    connectSrc?: Array<string>;
  };
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
    inlineStyle?: string;
    bodyHtml?: string;
  };
}
export type ImplementationSpec =
| IframeImplementationSpec
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
    fetchBindings?: Array<{
      pathPrefix: string;
      apiName: string;
      // validation?: boolean;
      // kind: "Api";
      // name: string;
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

export interface ApiEntity {
  _id?: string;
  apiVersion: "manifest.dist.app/v1alpha1";
  kind: "Api";
  metadata: EntityMetadata;
  spec: {
    type: "openapi";
    definition: string;
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

  // | EndpointEntity
  // | ServiceEntity
  // | DatabaseEntity
);
