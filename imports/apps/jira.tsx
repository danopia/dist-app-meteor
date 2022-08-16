import { Entity } from "/imports/db/entities";

class StaticCatalog {
  constructor(private readonly entries: Array<Entity>) {}
}

export const CounterCatalog = new StaticCatalog([{
  apiVersion: 'core/v1',
  kind: 'Namespace',
  metadata: {
    name: 'default',
    tags: ['exported'],
  },
  // spec: {
  //   export: 'true',
  // },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Application',
  metadata: {
    name: 'app',
    // namespace: 'default',
    title: 'da.gd lookup',
    description: 'Basic network connection and Internet query tool powered by da.gd',
    links: [{
      url: 'https://da.gd',
      type: 'homepage',
    }],
  },
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '👨‍💻',
        backgroundColor: '#000',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Endpoint',
  metadata: {
    name: 'main',
    // namespace: 'default',
  },
  spec: {
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'main',
    // namespace: 'default',
    title: 'da.gd',
  },
  spec: {
    intentFilters: [{
      action: 'Main',
      category: 'Launcher',
    }],
    type: 'iframe',
    ifram:
    implementationRefs: [{
      namespace: 'webapp',
      kind: 'Iframe',
      name: 'app',
    }],
  },
// }, {
//   apiVersion: 'core/v1',
//   kind: 'Blob',
//   metadata: {
//     name: 'icon',
//     // namespace: 'default',
//   },
//   spec: {
//     contentType: 'image/svg+xml',
//     stringData: `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 16 16'><text x='0' y='14'>👨‍💻</text></svg>`,
//   },
}])
