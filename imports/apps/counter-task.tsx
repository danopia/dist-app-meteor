import { html, stripIndent } from "common-tags";
import { Entity } from "/imports/entities";

export const CounterTaskCatalog = new Array<Entity>({
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Application',
  metadata: {
    name: 'app',
    title: 'Vue Counter',
    description: 'Demonstration of inline Javascript tasks (with Vue)',
    links: [{
      url: 'https://codepen.io/yuanyu/pen/JOvEEJ',
      type: 'original',
    }],
    tags: ['poc'],
  },
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '🧮',
        backgroundColor: '#aaa',
      },
    },
    // dependencies: {
    //   'service:dist.app/Tasks': 'v1alpha1',
    // },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'main',
    title: 'Counter (task)',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
    intentFilters: [{
      // TODO: these could be referencing entities
      action: 'app.dist.Main',
      category: 'app.dist.Launcher',
    }],
    implementation: {
      type: 'iframe',
      sandboxing: ['allow-scripts'],
      securityPolicy: {
        scriptSrc: ['https://unpkg.com'],
      },
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'Counter PoC',
        // scriptUrls: [
        //   'https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.37/vue.min.js',
        // ],
        inlineStyle: stripIndent`
          body { background: #ccc; }
        `,
        bodyHtml: stripIndent(html)`
          <div id="app">
            <h3>Counter</h3>
            <button @click="incrementCounter">Count is now {{counter}}</button>
            <p>This should be synced!</p>
          </div>
        `,
        inlineScript: stripIndent(html)`
          import { createApp } from "https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js";
          const distApp = await DistApp.connect();

          const app = createApp({
            data: () => distApp.useVueState('root', {
              counter: 0,
            }),
            methods: {
              incrementCounter: function () {
                this.counter += 1
              }
            }
          });

          app.mount('#app');

          await distApp.reportReady();
        `,
      },
    },
  },
});
