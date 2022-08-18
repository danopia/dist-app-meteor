import { html, stripIndent } from "common-tags";
import { StaticCatalog } from "/imports/api/catalog";

export const WelcomeCatalog = new StaticCatalog([{
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
    title: 'Welcome',
    description: 'First-time user experience for blank sessions',
    tags: ['poc'],
  },
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '🚀',
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
    title: 'Welcome Splash',
  },
  spec: {
    intentFilters: [{
      action: 'app.dist.Main',
      category: 'app.dist.Launcher',
    }],
    windowSizing: {
      initialWidth: 600,
      minWidth: 200,
      // maxWidth: 1000,
      initialHeight: 300,
      minHeight: 100,
      // maxHeight: 1000,
    },
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
        headTitle: 'Welcome Splash',
        bodyHtml: stripIndent(html)`
          <div id="app">
            <h1>Welcome to a dist.app shell.</h1>
            <p>
              This shell offers an experimental way of launching web-based applications.
              The principles of least-privilege, stateless programming, and single-purpose program units are leveraged together to reduce individual application complexity.
            </p>
            <p>
              To try out some demo applications, please look through the on-screen app tray.
            </p>
            <p>
              <strong>To enable session restore, use an account:</strong>
              <button @click="signIn">Sign in to dist.app</button>
            </p>
          </div>
        `,
        inlineStyle: stripIndent`
          body {
            font-family: sans-serif;
          }
        `,
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          import { createApp } from "https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js";
          const app = createApp({
            data: () => ({
              // total: 0
            }),
            // methods: {
            //   incrementTotal: function () {
            //     this.total += 1
            //   }
            // }
            methods: {
              signIn: function () {
                distApp.sendRpc({ rpc: 'launchIntent', intent: {
                  action: 'settings.AddAccount',
                  // flag new_task
                  extras: {
                    'AccountTypes': 'platform.dist.app',
                  },
                }});
              }
            }
          });
          app.mount('#app');

          await distApp.reportReady();
        `,
      },
    },
  },
}])
