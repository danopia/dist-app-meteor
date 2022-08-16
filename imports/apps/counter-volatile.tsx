import { html, stripIndent } from "common-tags";
import { StaticCatalog } from "/imports/api/catalog";

export const CounterVolatileCatalog = new StaticCatalog([{
  apiVersion: 'core/v1',
  kind: 'Namespace',
  metadata: {
    name: 'default',
    tags: ['exported'],
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Application',
  metadata: {
    name: 'app',
    // namespace: 'default',
    title: 'Volatile Counter',
    description: 'Demonstration of inline Javascript apps (with Vue)',
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
        backgroundColor: '#9ff',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'main',
    // namespace: 'default',
    title: 'Counter (volatile)',
  },
  spec: {
    intentFilters: [{
      action: 'app.dist.Main',
      category: 'app.dist.Launcher',
    }],
    implementation: {
      type: 'iframe',
      sandboxing: ['allow-scripts'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'Counter PoC',
        // scriptUrls: [
        //   'https://unpkg.com/vue@3.2.37/dist/vue.global.js',
        // ],
        bodyHtml: stripIndent(html)`
          <div id="app">
            <button @click="incrementTotal">
              Count is: {{ total }}
            </button>
            <button-counter @increment="incrementTotal"></button-counter>
            <button-counter @increment="incrementTotal"></button-counter>
          </div>
        `,
        inlineScript: stripIndent(html)`
          import { createApp } from "https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js";
          const app = createApp({
            data: () => ({
              total: 0
            }),
            methods: {
              incrementTotal: function () {
                this.total += 1
              }
            }
          });

          app.component('ButtonCounter', {
            template: \`<button @click="incrementCounter">{{counter}}</button>\`,
            data: function () {
              return {
                counter: 0
              }
            },
            methods: {
              incrementCounter: function() {
                this.counter += 1
                this.$emit('increment')
              }
            }
          });

          app.mount('#app');

          const distApp = await DistApp.connect();
          await distApp.reportReady();
        `,
      },
    },
  },
}])
