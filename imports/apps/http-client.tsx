import { html, stripIndent } from "common-tags";
import { StaticCatalog } from "/imports/api/catalog";

export const HttpClientCatalog = new StaticCatalog([{
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Application',
  metadata: {
    name: 'app',
    title: 'HTTP Client',
    description: 'Demonstration of issuing arbitrary HTTP calls',
    tags: ['poc'],
  },
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '🌐',
        backgroundColor: '#45b',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'main',
    title: 'HTTP Client',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
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
      },
      sandboxing: ['allow-scripts', 'allow-forms'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'HTTP client',
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          import { createApp, reactive } from "https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js";
          const app = createApp({
            data: () => ({
              request: {
                method: 'GET',
                url: 'https://da.gd/headers',
                headers: [],
                body: '',
              },
              history: [],
            }),
            methods: {
              sendRequest: async function () {
                const historyEntry = reactive({
                  request: JSON.parse(JSON.stringify(this.request)),
                  response: null,
                  error: null,
                  pending: true,
                  started: new Date(),
                });
                if (['GET', 'HEAD', 'DELETE'].includes(historyEntry.request.method)) {
                  historyEntry.request.body = null;
                }
                this.history.unshift(historyEntry);

                const resp = await fetch('dist-app:/protocolendpoints/http/invoke', {
                  method: 'POST',
                  body: JSON.stringify({ input: historyEntry.request }),
                });

                historyEntry.pending = false;
                historyEntry.response = {
                  status: resp.status,
                  headers: Array.from(resp.headers),
                  body: await resp.text(),
                };

                // setTimeout(() => {
                //   output.style.height = output.scrollHeight+'px';
                // }, 0);
              },
            },
          });

          app.mount('body');
          await distApp.reportReady();
        `,
        bodyHtml: stripIndent(html)`
          <h1>🌐 HTTP Client</h1>

          <form @submit.prevent="sendRequest">
            <select name="method" v-model="request.method">
              <option>GET</option>
              <option>HEAD</option>
              <option disabled>POST</option>
              <option disabled>PUT</option>
              <option disabled>DELETE</option>
              <option disabled>OPTIONS</option>
            </select>
            <input type="text" name="url" placeholder="URL" required autofocus v-model="request.url">
            <button type="submit">Fetch</button>
            <table class="header-grid" style="grid-column: 1 / 4">
              <tbody>
                <tr v-for="header in request.headers">
                  <th><input v-model="header[0]"></th>
                  <td><input v-model="header[1]"></td>
                  <td><button type="button" @click="request.headers.splice(request.headers.indexOf(header), 1)">X</button></td>
                </tr>
                <tr><td colspan="2"><button type="button" @click="request.headers.push(['Key','Value'])">Add header</button></td></tr>
              </tbody>
            </table>
          </form>

          <div id="history-col">
            <section class="entry" v-for="entry in history">
              <div class="entry-head">
                <a href class="deeplink">#</a>
                <h4>{{ entry.request.method }} {{ entry.request.url }}</h4>
              </div>
              <progress v-if="entry.pending"></progress>
              <div v-if="entry.response">
                <details class="response-details">
                  <summary>HTTP {{ entry.response.status }} ({{ entry.response.headers.length }} headers)</summary>
                  <table class="header-grid">
                    <tbody>
                      <tr v-for="header in entry.response.headers">
                        <th>{{ header[0] }}</th>
                        <td>{{ header[1] }}</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
                <textarea readonly="" rows="1" style="height: 150px;">{{ entry.response.body }}</textarea>
                <time></time>
              </div>
              <textarea v-if="entry.error" readonly="" class="error-msg" rows="1" style="height: 150px;">{{ entry.error.stack }}</textarea>
            </section>
            <section class="intro">
              <ul>
                <li>this basic tool can issue arbitrary HTTP requests against any URL</li>
              </ul>
            </section>
            <section class="footer">
              <div>
                requests will be sent through an arbitrary hosted server
              </div>
            </section>
          </div>
        `,
        inlineStyle: stripIndent`
          body {
            background-color: #333;
            color: #fff;
            margin: 0;
            padding: 2em 2em 10em;
            box-sizing: border-box;
            width: 100%;
            font-family: monospace;
          }
          h1 {
            margin: 0.3em 1em;
            color: #999;
          }
          form {
            display: grid;
            grid-template-columns: min-content 1fr 8em;
            grid-template-rows: 3em min-content;
            grid-gap: 1em;
            grid-auto-rows: 3em;
            margin: 1em;
          }
          input, textarea, select {
            box-sizing: border-box;
            background-color: #222;
            color: #fff;
            font-size: 1em;
            padding: 0.3em 0.5em;
            border: 1px solid #999;
            overflow-y: hidden;
          }
          input[readonly], textarea[readonly] {
            border-width: 0;
            background-color: #555;
            font-family: inherit;
            color: #fff;
          }
          button {
            font-size: 1.2em;
            border: 1px solid #999;
            background-color: #444;
            font-family: inherit;
            color: #fff;
          }
          section {
            font-size: 1.3em;
            margin: 0.8em;
            padding: 1em;
            background-color: rgba(200, 200, 200, 0.3);
          }
          .entry-head {
            padding: 0 0 0.3em;
          }
          @media (max-width: 800px) {
            body {
              padding: 1em 0 10em;
            }
            section {
              margin: 0.8em 0;
            }
            section.entry {
              padding: 0;
              text-align: center;
            }
            .entry-head {
              padding: 0.5em;
            }
            progress {
              margin-bottom: 1em;
            }
          }
          h3 {
            margin: 0.2em 0 0.4em;
          }
          h3:not(:first-child) {
            padding-top: 1.2em;
          }
          a.deeplink {
            margin-right: 0.4em;
          }
          h4 {
            display: inline;
            margin: 0em 0 0.2em;
          }
          section.entry textarea {
            width: 100%;
            resize: vertical;
            vertical-align: bottom;
          }
          .error-msg {
            color: #f33 !important;
          }
          a {
            color: #ccc;
          }
          section.intro {
            padding: 0.5em 1em;
          }
          section.intro ul {
            padding: 0 0.5em;
            list-style: none;
          }
          section.footer {
            background-color: rgba(200, 200, 200, 0.15);
            color: rgba(200, 200, 200, 0.5);
          }
          section.footer a {
            color: rgba(200, 200, 200, 0.8);
          }

          .header-grid {
            text-align: left;
          }
          .header-grid input {
            width: 100%;
            box-sizing: border-box;
          }
        `,
      },
    },
  },
}])
