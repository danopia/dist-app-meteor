import { html, stripIndent } from "common-tags";
import { useVueState } from "./_vue";
import { Entity } from "/imports/entities";

export const HttpClientCatalog = new Array<Entity>({
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

          async function sendInternetRequest(request) {
            const resp = await distApp.fetch('dist-app:/protocolendpoints/http/invoke', {
              method: 'POST',
              body: JSON.stringify({ input: {
                ...request,
                headers: request.headers.filter(x => x[0]),
              }}),
            });
            if (!resp.ok) throw new Error("HTTP gateway gave its own "+resp.status+" response");

            const respData = await resp.json();
            return {
              status: respData.status,
              headers: respData.headers,
              body: respData.body,
            };
          }
          async function sendInternalRequest(request) {
            const resp = await distApp.fetch(request.url.replace(/^internal:/, ''), {
              method: request.method,
              headers: new Headers(request.headers.filter(x => x[0])),
              body: request.body,
            });
            return {
              status: resp.status,
              headers: Array.from(resp.headers),
              body: await resp.text(),
            };
          }

          import { createApp, reactive, watchEffect } from "https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js";
          const distApp = await DistApp.connect();
          ${useVueState}

          const request = await useVueState('request', {
            method: 'GET',
            url: 'https://da.gd/headers',
            headers: [
              ['accept', 'text/plain, application/json;q=0.9, text/*;q=0.8, */*;q=0.7'],
              ['user-agent', 'dist-app-poc/0.1 (+https://github.com/danopia/dist-app-poc)'],
            ],
            body: '',
          });

          const app = createApp({
            data: () => ({
              request: request(),
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

                try {
                  if (historyEntry.request.url.startsWith('internal:')) {
                    historyEntry.response = await sendInternalRequest(historyEntry.request);
                  } else {
                    historyEntry.response = await sendInternetRequest(historyEntry.request);
                  }
                  historyEntry.pending = false;
                } catch (err) {
                  console.error(err.stack);
                  historyEntry.pending = false;
                  historyEntry.error = {
                    stack: err.message,
                  };
                }

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
            <button type="button" @click="request.headers.push(['',''])">Add header</button>
            <button type="submit">Fetch</button>
            <div class="header-input-grid">
              <template v-for="header in request.headers">
                <input placeholder="Header name" v-model="header[0]" list="request-headers">
                <input placeholder="Header contents" v-model="header[1]">
                <button class="square" type="button" @click="request.headers.splice(request.headers.indexOf(header), 1)">X</button>
              </template>
            </div>
          </form>

          <!-- TODO: add more from like https://da.gd/headers -->
          <!-- TODO: parameterize using some external config, or make it dynamic/learning -->
          <datalist id="request-headers">
            <option value="accept">
            <option value="accept-encoding">
            <option value="accept-charset">
            <option value="accept-datetime">
            <option value="accept-encoding">
            <option value="accept-language">
            <option value="access-control-request-method">
            <option value="access-control-request-headers">
            <option value="authorization">
            <option value="cache-control">
            <option value="content-encoding">
            <option value="content-type">
            <option value="cookie">
            <option value="forwarded">
            <option value="if-match">
            <option value="if-modified-since">
            <option value="if-none-match">
            <option value="if-range">
            <option value="if-unmodified-since">
            <option value="origin">
            <option value="range">
            <option value="referer">
            <option value="upgrade-insecure-requests">
            <option value="user-agent">
            <option value="via">
            <option value="x-requested-with">
            <option value="x-forwarded-for">
            <option value="x-forwarded-host">
            <option value="x-forwarded-proto">
            <option value="x-csrf-token">
          </datalist>

          <div id="history-col">
            <section class="entry" v-for="entry in history">
              <progress v-if="entry.pending"></progress>
              <div v-if="entry.request" class="entry-body">
                <details class="request-details">
                  <summary>{{ entry.request.method }} {{entry.request.url}} ({{ entry.request.headers.length }} headers)</summary>
                  <table class="header-grid" border="1">
                    <tbody>
                      <tr v-for="header in entry.request.headers">
                        <th>{{ header[0] }}</th>
                        <td>{{ header[1] }}</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
              </div>
              <div v-if="entry.response" class="entry-body">
                <details class="response-details">
                  <summary>HTTP {{ entry.response.status }} ({{ entry.response.headers.length }} headers)</summary>
                  <table class="header-grid" border="1">
                    <tbody>
                      <tr v-for="header in entry.response.headers">
                        <th>{{ header[0] }}</th>
                        <td>{{ header[1] }}</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
              </div>
              <textarea v-if="entry.response" readonly rows="1" style="height: 150px;">{{ entry.response.body }}</textarea>
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
            padding: 0 2em 10em;
            box-sizing: border-box;
            width: 100%;
            font-family: monospace;
          }
          form {
            display: grid;
            grid-template-columns: min-content minmax(8em,1fr) 8em 8em;
            grid-template-rows: 3em min-content;
            grid-gap: 1em;
            grid-auto-rows: 3em;
            margin: 1em;
          }
          input, textarea, select, button {
            box-sizing: border-box;
            font-family: inherit;
            padding: 0.3em 0.5em;
            border: 1px solid #999;
          }
          input, textarea, select {
            background-color: #222;
            color: #fff;
            font-size: 1em;
            /*overflow-y: hidden;*/
          }
          input[readonly], textarea[readonly] {
            border-width: 0;
            background-color: #555;
            color: #fff;
          }
          button {
            background-color: #444;
            color: #fff;
            cursor: pointer;
          }
          button:hover, button:focus {
            border: 1px solid #ccc;
            background-color: #666;
          }
          button.primary {
            font-size: 1.2em;
          }
          button.square {
            aspect-ratio: 1;
          }
          section {
            font-size: 1em;
            margin: 0.8em;
            padding: 1em;
            background-color: rgba(200, 200, 200, 0.3);
          }
          .entry details {
            margin: 0.3em 0;
          }
          @media (max-width: 800px) {
            body {
              padding: 0 0 10em;
            }
            section {
              margin: 0.8em 0;
            }
            section.entry {
              padding-left: 0;
              padding-right: 0;
              /* text-align: center; */
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
          .header-input-grid {
            grid-column: 1 / 5;
            display: grid;
            grid-template-columns: minmax(6em,1fr) minmax(8em,2fr) 2.5em;
            grid-gap: 0.2em;
          }
          section.entry textarea {
            width: 100%;
            resize: vertical;
            vertical-align: bottom;
            padding: 0.3em 1em;
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
          .entry-body {
            margin: 0 1em;
          }
          section.footer {
            background-color: rgba(200, 200, 200, 0.15);
            color: rgba(200, 200, 200, 0.5);
          }
          section.footer a {
            color: rgba(200, 200, 200, 0.8);
          }

          .entry .header-grid {
            width: 100%;
            margin: 0.2em 0 0.5em;
          }
          .header-grid input {
            width: 100%;
            box-sizing: border-box;
          }
          .header-grid th {
            text-align: left;
          }
          .header-grid td {
            word-break: break-word;
          }
        `,
      },
    },
  },
});
