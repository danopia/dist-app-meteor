import { AppBuilder } from "../app-builder";

const builder = new AppBuilder();

const app = builder.app('app', {
  title: 'App Market',
  description: 'Find applications to install.',
  tags: ['poc'],
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '🏪',
        backgroundColor: '#bf7a41',
      },
    },
  },
});

builder.activity('main', {
  title: 'App Market',
  appRef: app,
  spec: {
    intentFilters: [{
      action: 'app.dist.Main',
      category: 'app.dist.Launcher',
    }],
    windowSizing: {
      initialWidth: 800,
      initialHeight: 500,
    },
    implementation: {
      type: 'iframe',
      securityPolicy: {
        scriptSrc: ['https://unpkg.com'],
        imgSrc: ['*', 'data:'],
      },
      sandboxing: ['allow-scripts'],
      source: builder.piecemealSourceFromFiles(__dirname, 'ui'),
    },
  },
});

builder.done();
