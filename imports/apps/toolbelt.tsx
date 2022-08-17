import { html, stripIndent } from "common-tags";
import { StaticCatalog } from "/imports/api/catalog";

export const ToolbeltCatalog = new StaticCatalog([{
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
    title: 'Developer Toolbelt',
    description: 'Demonstration of inline utility Javascript apps',
    tags: ['poc'],
  },
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '👨‍💻',
        backgroundColor: '#9ff',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'launcher',
    // namespace: 'default',
    title: 'Developer Toolbelt',
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
        bodyHtml: stripIndent(html)`
          <h1>&#128104;&#8205;&#128187; devmode.cloud developer toolbelt</h1>
          <ul id="tool-list"></ul>
          <style type="text/css">
            body {
              background-color: #333;
              color: #fff;
              margin: 0;
              display: flex;
              flex-direction: column;
              height: 100vh;
              padding: 2em;
              box-sizing: border-box;
              min-width: 40em;
              font-family: monospace;
            }
            h1 {
              margin: 0.3em 1em;
              color: #999;
            }

            #tool-list {
              margin: 4em 0;
              display: flex;
              flex-wrap: wrap;
              list-style: none;
            }
            #tool-list li {
              margin: 1em;
              flex-basis: 20em;
            }
            #tool-list a {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1em;
              height: 3em;

              font-size: 1.6em;
              background-color: rgba(200, 200, 200, 0.5);
              color: #fff;

              transition: background-color 0.2s linear;
            }
            #tool-list a:not(:hover) {
              text-decoration: none;
              background-color: rgba(200, 200, 200, 0.3);
            }
          </style>
        `,
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          // TODO: use distApp instance to fetch the available activities
          // TODO: categorize activities by encoding, networking, calculating (codec)

          // const toolListP = fetch('/~~export', {
          //   method: 'POST',
          //   body: JSON.stringify({
          //     Op: 'enumerate',
          //     Path: '/public/web/toolbelt',
          //     Depth: 1,
          //   }),
          // })
          //   .then(x => x.json())
          //   .then(x => x.Output.Children)
          //   .then(x => x
          //         .filter(x => x.Type === 'File')
          //         .filter(x => x.Name !== 'index.html')
          //         .filter(x => x.Name !== 'prettyjson.html')
          //         .map(x => x.Name));
          const list = await Promise.resolve([
            'aws-ips.html',
            'base64.html',
            'binary.html',
            // 'calculator.html',
            'dagd.html',
            'irc-colors.html',
            'jwt.html',
            'pretty-json.html',
            // 'regex-tester.html',
            'timestamp.html',
            'urlencode.html',
          ]);

          const toolList = document.getElementById('tool-list');

          list.forEach(file => {
            const baseName = file.split('.').slice(0, -1).join('.');

            const li = document.createElement('li');
            const a = document.createElement('a');
            const span = document.createElement('span');
            li.appendChild(a);
            a.appendChild(span);
            a.setAttribute('href', baseName);
            span.innerText = baseName.replace(/-/g, ' ');

            toolList.appendChild(li);
          });

          toolList.addEventListener('click', evt => {
            evt.preventDefault();
            const href = evt.target.closest('a').getAttribute('href');
            distApp.sendRpc({ rpc: 'launchIntent', intent: {
              activity: {
                name: href,
              },
            }});
          });

          await distApp.reportReady();
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'base64',
    // namespace: 'default',
    title: 'Base64 encoding',
  },
  spec: {
    implementation: {
      type: 'iframe',
      sandboxing: ['allow-scripts', 'allow-forms'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'base64 tool',
        bodyHtml: stripIndent(html)`
          <h1>&#128104;&#8205;&#128187; base64 encode/decode tool</h1>
          <form id="decode">
            <textarea class="left" name="encoded" placeholder="base64 encoded"></textarea>
            <button type="submit">Decode!</button>
            <textarea class="right" name="decoded" placeholder="decoded"></textarea>
            <textarea class="right" name="bytes" placeholder="hex bytes"></textarea>
          </form>

          <form id="encode">
            <textarea class="left" name="decoded" placeholder="plain text"></textarea>
            <button type="submit">Encode!</button>
            <textarea class="right" name="encoded" placeholder="encoded"></textarea>
            <textarea class="right" name="bytes" placeholder="hex bytes"></textarea>
          </form>
          <style type="text/css">
            body {
              background-color: #333;
              color: #fff;
              margin: 0;
              display: flex;
              flex-direction: column;
              height: 100vh;
              padding: 2em;
              box-sizing: border-box;
              min-width: 40em;
              font-family: monospace;
            }
            h1 {
              margin: 0.3em 1em;
              color: #999;
            }
            form {
              display: grid;
              grid-template-columns: 1fr 8em 1fr;
              grid-gap: 1em;
              grid-auto-rows: minmax(3em, auto);

              margin: 1em;
              flex: 1;
            }
            textarea {
              background-color: #111;
              color: #fff;
              padding: 0.2em 0.5em;
            }
            textarea.left {
              grid-column: 1;
              grid-row: span 2;
            }
            textarea.right {
              grid-column: 3;
            }
            button {
              grid-column: 2;
              grid-row: span 2;
              background-color: #555;
              font-family: inherit;
              color: #fff;
            }
          </style>
        `,
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          function rawToBytes(raw) {
            const bytes = [];
            for (var i = 0; i < raw.length; i++) {
              bytes.push(raw.codePointAt(i));
            }
            return bytes.map(x => x.toString(16)).join(' ');
          }

          document.querySelector('#decode').addEventListener('submit', evt => {
            evt.preventDefault();
            try {
              const encoded = evt.target.encoded.value;
              const decoded = atob(encoded);
              evt.target.decoded.value = decoded;
              evt.target.bytes.value = rawToBytes(decoded);
            } catch (err) {
              alert(err);
            }
          });

          document.querySelector('#encode').addEventListener('submit', evt => {
            try {
              evt.preventDefault();
              const decoded = evt.target.decoded.value;
              const encoded = btoa(decoded);
              evt.target.encoded.value = encoded;
              evt.target.bytes.value = rawToBytes(decoded);
            } catch (err) {
              alert(err);
            }
          });

          await distApp.reportReady();
        `,
      },
    },
  },
}])
