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
      sandboxing: ['allow-scripts', 'allow-forms'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'AWS IPs',
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          const historyCol = document.querySelector('#history-col');
          function addEntry () {

            const title = document.createElement('h4');
            const progress = document.createElement('progress');
            const output = document.createElement('textarea');
            output.readOnly = true;
            output.rows = 1;
            const time = document.createElement('time');

            const headbox = document.createElement('div');
            headbox.classList.add('entry-head');
            headbox.appendChild(title);

            const box = document.createElement('section');
            box.classList.add('entry');
            box.appendChild(headbox);
            box.appendChild(progress);
            historyCol.insertBefore(box, historyCol.children[0]);

            const finalizeBox = () => {
              box.removeChild(progress);

              box.appendChild(output);
              box.appendChild(time);
              setTimeout(() => {
                output.style.height = output.scrollHeight+'px';
              }, 0);
            }

            return {
              deeplink(path) {
                const deeplink = document.createElement('a');
                deeplink.href = '#' + encodeURIComponent(path);
                deeplink.innerText = '#';
                deeplink.classList.add('deeplink');
                headbox.insertBefore(deeplink, title);
              },
              title(text) { title.innerText = text; },
              promise(p) {
                return p.then(text => {
                  output.value = text.trim();
                  finalizeBox();
                }, err => {
                  output.classList.add('error-msg');
                  output.value = err.message || JSON.stringify(err, null, 2);
                  finalizeBox();
                });
              },
            };
          };

          function ParseInput(rawInput) {
            const url = new URL(rawInput);
            return {
              text: url.toString(),
              type: 'url',
            };
          }

          function queryInput(input, andSetHash=false) {
            const entry = addEntry();
            entry.title(input.method + ' ' + input.url);
            // entry.deeplink(input.text);

            // if (andSetHash)
            //   window.location.hash = \`#\${encodeURIComponent(input.text)}\`;

            return entry.promise((async () => {
              const resp = await fetch('dist-app:/protocolendpoints/http/invoke', {
                method: 'POST',
                body: JSON.stringify({input}),
              });

              return 'HTTP '+resp.status+'\\n'+Array.from(resp.headers).map(x => x.join(': ')).join('\\n')+'\\n\\n'+(await resp.text());
            })());
          }

          const form = document.querySelector('form');
          form.addEventListener('submit', evt => {
            evt.preventDefault();
            const url = new URL(evt.target.url.value).toString();
            const method = evt.target.method.value;
            queryInput({url, method}, true);
            // .then(() => url.value = '');
          });

          await distApp.reportReady();
        `,
        bodyHtml: stripIndent(html)`
          <h1>🌐 HTTP Client</h1>

          <form id="lookup">
            <select name="method">
              <option>GET</option>
              <option>HEAD</option>
              <option disabled>POST</option>
              <option disabled>PUT</option>
              <option disabled>DELETE</option>
              <option disabled>OPTIONS</option>
            </select>
            <input type="text" name="url" placeholder="URL" required autofocus value="https://da.gd/ip">
            <button type="submit">Fetch</button>
          </form>

          <div id="history-col">
            <section class="intro">
              <ul>
                <li>howdy</li>
              </ul>
            </section>
            <section class="footer">
              <div>
                toolbelt tools by
                <a target="_new" href="https://github.com/danopia">@danopia</a>
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
            max-width: 60em;
            font-family: monospace;
          }
          h1 {
            margin: 0.3em 1em;
            color: #999;
          }
          form {
            display: grid;
            grid-template-columns: min-content 1fr 8em;
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
        `,
      },
    },
  },
}])
