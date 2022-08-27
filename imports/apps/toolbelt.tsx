import { html, stripIndent } from "common-tags";
import { Entity } from "/imports/entities";

export const ToolbeltCatalog = new Array<Entity>({
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Application',
  metadata: {
    name: 'app',
    title: 'Developer Toolbelt',
    description: 'Demonstration of inline utility Javascript apps',
    tags: ['poc'],
  },
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '👨‍💻',
        backgroundColor: '#363',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'launcher',
    title: 'Developer Toolbelt',
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
      sandboxing: ['allow-scripts'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'Counter PoC',
        bodyHtml: stripIndent(html)`
          <h1>&#128104;&#8205;&#128187; developer toolbelt</h1>
          <ul id="tool-list"></ul>
        `,
        inlineStyle: stripIndent`
          html {
            height: 100%;
          }
          body {
            display: grid;
            grid-template-rows: 5em 1fr;
            box-sizing: border-box;
            height: 100%;
            margin: 0;
            padding: 0.5em;

            background-color: #333;
            color: #fff;
            font-family: monospace;
          }
          h1 {
            margin: 0.3em 1em;
            color: #999;
            position: sticky;
            top: 0;
            background-color: #333;
          }
          #tool-list {
            list-style: none;
            padding: 0;
            margin: 0 1em;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            grid-template-rows: repeat(auto-fit, max(1fr, 10em));
            justify-content: space-around;
            gap: 3em;
            max-width: 1200px;
          }
          @media (min-width: 1200px) {
            body {
              font-size: 1.15em;
            }
          }
          @media (max-width: 900px) {
            #tool-list {
              grid-template-columns: 1fr 1fr 1fr;
              gap: 2em;
            }
          }
          @media (max-width: 600px) {
            #tool-list {
              grid-template-columns: 1fr 1fr;
              gap: 1.5em;
            }
            body {
              font-size: 0.9em;
            }
          }
          @media (max-width: 400px) {
            #tool-list {
              grid-template-columns: 1fr;
            }
          }
          #tool-list li {
            display: grid;
          }
          #tool-list a {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1em;
            box-sizing: border-box;

            font-size: 1.6em;
            background-color: rgba(200, 200, 200, 0.5);
            color: #fff;

            transition: background-color 0.2s linear;
          }
          #tool-list a:not(:hover) {
            text-decoration: none;
            background-color: rgba(200, 200, 200, 0.3);
          }
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
    name: 'aws-ips',
    title: 'AWS Or Not',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
    windowSizing: {
      initialWidth: 800,
      initialHeight: 500,
    },
    implementation: {
      type: 'iframe',
      sandboxing: ['allow-scripts', 'allow-forms'],
      securityPolicy: {
        connectSrc: ['https://ip-ranges.amazonaws.com', 'https://raw.githubusercontent.com', 'https://da.gd'],
      },
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'AWS IPs',
        bodyHtml: stripIndent(html)`
          <h1>&#128104;&#8205;&#128187; AWS IP Resolver</h1>

          <form id="lookup">
            <input type="text" name="ipaddr" placeholder="Paste an IP address, hostname, or URL" required autofocus>
            <button type="submit">Lookup</button>
          </form>

          <div id="history-col">
            <section class="intro">
              <ul>
                <li><strong>example lookups</strong></li>
                <li><a href="#amazon.com">amazon.com</a> (the online store)</li>
                <li><a href="#console.aws.amazon.com">console.aws.amazon.com</a></li>
                <li><a href="#status.aws.amazon.com">status.aws.amazon.com</a></li>
                <li><a href="#slack.com">slack.com</a> (CloudFront)</li>
                <li><a href="#api.spotify.com">api.spotify.com</a> (Google Cloud)</li>
                <li><a href="#heroku.com">heroku.com</a></li>
                <li><a href="#github.scopely.io">github.scopely.io</a> (dual region!)</li>
                <li><a href="#collector.scopely.io">collector.scopely.io</a> (IPv6)</li>
                <li><a href="#bethesda.net">bethesda.net</a> (CloudFront)</li>
                <li><a href="#cloudycluster.com">cloudycluster.com</a> (S3)</li>
                <li><a href="#cloudping.co">cloudping.co</a></li>
                <li><a href="#pepedev.com">pepedev.com</a></li>
                <li><a href="#fortunecookie-vpn.scopely.io">fortunecookie-vpn.scopely.io</a></li>
                <li><a href="#status.github.com">status.github.com</a></li>
                <li><a href="#en.wikipedia.org">en.wikipedia.org</a> (non-AWS)</li>
                <li><a href="#8.8.8.8">Cloudflare DNS</a> (non-AWS)</li>
              </ul>
              <ol>
                <li>Enter an Internet IPv4, hostname, or URL</li>
                <li>
                  Discover which <strong>AWS Region</strong>
                  and <strong>AWS Service</strong>
                  keeps it running
                </li>
                <li>
                  For non-AWS addresses, only the
                  <abbr title="The IP address block's WHOIS data is grepped searching for an ISP name. Not a precise art.">ISP (?)</abbr>
                  is shown
                </li>
              </ol>
            </section>
            <section class="footer">
              <div>
                toolbelt tools by
                <a target="_new" href="https://github.com/danopia">@danopia</a>
              </div>
              <div>
                <a target="dagd" href="https://da.gd/help#host">DNS</a>
                and
                <a target="dagd" href="https://da.gd/help#isp">ISP</a>
                resolution by
                <a target="dagd" href="https://da.gd">da.gd</a>
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
            grid-template-columns: 1fr 8em;
            grid-gap: 1em;
            grid-auto-rows: 3em;
            margin: 1em;
          }
          input, textarea {
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
                deeplink.href = '#' + encodeURI(path);
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

          function FirstThenPlusN(list, firstN) {
            if (list.length <= firstN)
              return list.join(', ');
            return \`\${list.slice(0, firstN).join(', ')} (+ \${list.length-firstN})\`;
          }

          function ParseInput(rawInput) {
            const v4Match = rawInput.match(/((?:\\d{1,3}\\.){3}\\d{1,3})(\\/|:|$)/);
            const dnsMatch = rawInput.match(/([a-z0-9.-]+\\.[a-z][a-z0-9-]+)(\\/|:|$)/i);
            if (v4Match) {
              return {
                text: v4Match[1].toLowerCase(),
                type: 'ipv4',
              };
            } else if (dnsMatch) {
              return {
                text: dnsMatch[1].toLowerCase(),
                type: 'dns',
              };
            } else {
              throw new Error(\`Couldn't parse input: \${rawInput}\`);
            }
          }

          function IPv4ToInt(ip) {
            return ip
              .split('.')
              .reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
          }
          class PrefixManager {
            constructor(data, source) {
              this.prefixSource = source;
              this.syncToken = data.syncToken;
              if (source === 'aws') {
                const [Y,M,D,h,m,s] = data.createDate.split('-');
                this.createDate = Date.parse(\`\${Y}-\${M}-\${D}T\${h}:\${m}:\${s}Z\`);

                this.v4Prefixes = data.prefixes;
                this.v6Prefixes = data.ipv6_prefixes;
              } else if (source === 'gcloud') {
                this.createDate = Date.parse(data.creationTime);

                this.v4Prefixes = data.prefixes.filter(x => 'ipv4Prefix' in x)
                  .map(x => ({ip_prefix: x.ipv4Prefix, region: x.scope, service: x.service}));
                this.v6Prefixes = data.prefixes.filter(x => 'ipv6Prefix' in x)
                  .map(x => ({ip_prefix: x.ipv6Prefix, region: x.scope, service: x.service}));
              }
            }
            v4Matches(ip) {
              const ipAsInt = IPv4ToInt(ip);
              const matches = this.v4Prefixes.filter(alloc => {
                const [range, bits = 32] = alloc.ip_prefix.split('/');
                const mask = ~(2 ** (32 - bits) - 1);
                return (ipAsInt & mask) === (IPv4ToInt(range) & mask);
              });
              return matches;
            }
          }

          const awsPromise = (async function () {
            const resp = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json')
            const json = await resp.json();
            return new PrefixManager(json, 'aws');
          })();
          const gcloudPromise = (async function () {
            // CORS...
            // const resp = await fetch('https://www.gstatic.com/ipranges/cloud.json')
            // const resp = await fetch('gcloud.json')
            const resp = await fetch('https://raw.githubusercontent.com/devmode-cloud/devmode.cloud/master/firebase/public/toolbelt/gcloud.json');
            const json = await resp.json();
            return new PrefixManager(json, 'gcloud');
          })();
          const managersPromise = Promise.all([
            awsPromise,
            gcloudPromise,
          ])

          const existingQueries = new Map;
          function queryInput(input, andSetHash=false) {
            if (existingQueries.has(input.text))
              return Promise.resolve();

            const entry = addEntry();
            entry.title(input.text);
            entry.deeplink(input.text);
            existingQueries.set(input.text, entry);

            if (andSetHash)
              window.location.hash = \`#\${encodeURI(input.text)}\`;

            return entry.promise(managersPromise.then(async managers => {
              let header = '';
              let primaryAddress;
              let ranges = new Set;

              switch (input.type) {
                case 'ipv4':
                  primaryAddress = input.text;
                  for (const manager of managers) {
                    console.log(managers)
                    manager.v4Matches(input.text)
                      .forEach(x => ranges.add(x));
                  }
                  break;

                case 'dns':
                  const dagdResp = await fetch(\`https://da.gd/host/\${encodeURI(input.text)}\`);
                  const dagdText = await dagdResp.text();
                  if (dagdText.match(/[^0-9a-f:., \\n]/i))
                    throw new Error(dagdText.trim());

                  const addresses = dagdText.trim().split(', ');
                  const v4Addresses = addresses.filter(x => x.includes('.'));
                  const v6Addresses = addresses.filter(x => x.includes(':'));
                  primaryAddress = v4Addresses[0] || v6Addresses[0];

                  if (v4Addresses.length > 0)
                    header += \`IPv4: \${FirstThenPlusN(v4Addresses, 3)}\\n\`;
                  if (v6Addresses.length > 0)
                    header += \`IPv6: \${FirstThenPlusN(v6Addresses, 1)}\\n\`;

                  for (const v4Addr of v4Addresses) {
                    for (const manager of managers) {
                      manager.v4Matches(v4Addr)
                        .forEach(x => ranges.add(x));
                    }
                  }
                  break;

                default:
                  throw new Error(\`Input of invalid type: \${input.type}\`);
              }

              if (ranges.size === 0 && primaryAddress) {
                const ispResp = await fetch(\`https://da.gd/isp/\${primaryAddress}\`);
                const ispText = await ispResp.text();
                header += \`Not AWS: \${ispText.trim()}\`;
              }

              const rangeMap = new Map;
              for (const range of ranges) {
                const key = [
                  range.ip_prefix,
                  range.region,
                ].join('#');
                if (!rangeMap.has(key)) rangeMap.set(key, new Array);
                rangeMap.get(key).push(range);
              }

              const rangeMap2 = new Map;
              for (const ranges of rangeMap.values()) {
                const key = [
                  ranges[0].region,
                  ...ranges.map(x => x.service).sort(),
                ].join('#');
                if (!rangeMap2.has(key)) rangeMap2.set(key, new Array);
                const list = rangeMap2.get(key)
                for (const range of ranges) {
                  list.push(range);
                }
              }

              const results = Array
                .from(rangeMap2.values())
                .map(matches => {
                  const prefixes = Array.from(new Set(matches.map(x => x.ip_prefix)));
                  const services = Array.from(new Set(matches.map(x => x.service)));
                  return [
                    \`Prefix\${prefixes.length>1?'es':''}: \${prefixes.join(', ')}\`,
                    \`Region: \${matches[0].region}\`,
                    \`Service: \${services.join(' ')}\`,
                  ].join('\\n');
                });

              return header + '\\n' + results.join('\\n\\n');
            }));
          }

          const form = document.querySelector('form');
          form.addEventListener('submit', evt => {
            evt.preventDefault();
            const {ipaddr} = evt.target;
            const rawInput = ipaddr.value;
            queryInput(ParseInput(rawInput), true)
              .then(() => ipaddr.value = '');
          });

          const inputBox = form.ipaddr;
          inputBox.addEventListener('paste', evt => {
            try {
              const pasteData = evt.clipboardData.getData('text');
              queryInput(ParseInput(pasteData), true)
                .then(() => inputBox.value = '');
            } catch (err) {
              console.log('not acting on paste.', err);
            }
          });

          function readHash() {
            const hash = window.location.hash;
            if (hash && hash.length > 1) {
              queryInput(ParseInput(decodeURI(hash.slice(1))));
            }
          }
          window.onhashchange = readHash;
          // readHash();

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
    title: 'Base64 encoding',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
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
        `,
        inlineStyle: stripIndent`
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
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'jwt',
    title: 'JWT inspector',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
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
        headTitle: 'jwt inspector tool',
        bodyHtml: stripIndent(html)`
          <h1>&#128104;&#8205;&#128187; jwt inspector tool</h1>

          <form id="decode">
            <textarea class="left" name="token" placeholder="jwt body"></textarea>
            <button type="submit">Inspect!</button>
            <textarea class="right" name="header" placeholder="header data"></textarea>
            <textarea class="right" name="body" placeholder="body data"></textarea>
          </form>
        `,
        inlineStyle: stripIndent`
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
            grid-template-columns: 1fr min(20%, 8em) 1fr;
            grid-gap: 1em;
            grid-template-rows: min(33%,8em) 1fr;

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
        `,
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          const jwtBox = document.querySelector('[name=token]');
          const form = document.querySelector('form');

          function decodeJWT(jwt) {
            const parts = jwt.split('.');
            if (parts.length != 3) {
              alert('thats no jwt!');
              return;
            }

            const header = JSON.parse(atob(parts[0]));
            const body = JSON.parse(atob(parts[1]));
            console.log(header, body);
            //evt.target.decoded.value = decoded;

            document.querySelector('[name=header]').value = JSON.stringify(header, null, 2);
            document.querySelector('[name=body]').value = JSON.stringify(body, null, 2);
          }

          form.addEventListener('submit', evt => {
            evt.preventDefault();
            try {
              decodeJWT(jwtBox.value);
            } catch (err) {
              alert(err);
            }
          });

          jwtBox.focus();
          jwtBox.addEventListener('paste', evt => {
            try {
              jwtBox.value = '';
              decodeJWT(evt.clipboardData.getData('text'));
            } catch (err) {
              alert(err);
            }
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
    name: 'pretty-json',
    title: 'JSON formatter',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
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
        headTitle: 'json formatter tool',
        bodyHtml: stripIndent(html)`
          <h1>&#128104;&#8205;&#128187; json formatter tool</h1>

          <form id="decode">
            <textarea class="left" name="input" placeholder="body"></textarea>
            <button type="submit">Format!</button>
            <textarea class="right" name="output" placeholder="data"></textarea>
          </form>
        `,
        inlineStyle: stripIndent`
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
            grid-template-rows: 1fr;

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
            grid-row: span 2;
          }
          button {
            grid-column: 2;
            grid-row: span 2;
            background-color: #555;
            font-family: inherit;
            color: #fff;
          }
        `,
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          const inputBox = document.querySelector('[name=input]');
          const outputBox = document.querySelector('[name=output]');
          const form = document.querySelector('form');

          function prettify(raw) {
            var input = JSON.parse(raw);

            // if user pasted JSON-encoded string, try parsing it as an object
            // useful feature when extracting JSON from a parent JSON document
            if (input.constructor === String) {
              // TODO: nicer messaging
              alert("Automatically parsing contents of JSON string as JSON");
              input = JSON.parse(input);
            }

            outputBox.value = JSON.stringify(input, null, 2);
          }

          form.addEventListener('submit', evt => {
            evt.preventDefault();
            try {
              prettify(inputBox.value);
            } catch (err) {
              alert(err);
            }
          });

          inputBox.focus();
          inputBox.addEventListener('paste', evt => {
            try {
              inputBox.value = '';
              prettify(evt.clipboardData.getData('text'));
            } catch (err) {
              alert(err);
            }
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
    name: 'timestamp',
    title: 'timestamp conversion tool',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
    windowSizing: {
      initialWidth: 800,
      initialHeight: 500,
    },
    implementation: {
      type: 'iframe',
      sandboxing: ['allow-scripts', 'allow-forms'],
      securityPolicy: {
        scriptSrc: ['https://cdnjs.cloudflare.com'],
      },
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'timestamp conversion tool',
        scriptUrls: [
          "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.20.1/moment.js",
          "https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.14/moment-timezone-with-data.min.js",
        ],
        bodyHtml: stripIndent(html)`
          <h1>&#128104;&#8205;&#128187; timestamp conversion tool</h1>

          <section id="current-epoch">
            <label for="current-epoch-box">The current Epoch timestamp:</label>
            <input class="epoch" id="current-epoch-box" type="text" readonly />
            <label>seconds</label>
          </section>

          <section id="epoch-to-time">
            <table class="formats">
              <tr>
                <td colspan="2"><input class="epoch" id="input-epoch-box" type="text" placeholder="1234567890" autofocus /></td>
                <th><label for="input-epoch-box">Input Epoch timestamp</label></th>
              </tr>
              <tr>
                <td>➡</td>
                <td><select id="output-format-select">
                  <option value="LLL" selected>Friendly date/time</option>
                  <option value="l LTS">Numeric date/time</option>
                  <option value="YYYY-MM-DDTHH:mm:ssZ">ISO-8601</option>
                </select></td>
                <th><label for="output-format-select">Output format</label></th>
              </tr>
              <tr>
                <td>↳</td>
                <td><input id="epoch-to-time-local" type="text" readonly /></td>
                <th><label for="epoch-to-time-local">Your browser time</label></th>
              </tr>
              <tr>
                <td>↳</td>
                <td><input id="epoch-to-time-utc" type="text" readonly /></td>
                <th><label for="epoch-to-time-utc">UTC</label></th>
              </tr>
              <tr>
                <td>↳</td>
                <td><input id="epoch-to-time-tz" type="text" readonly /></td>
                <th><select id="output-tz-select"></select></th>
              </tr>
              <tr class="addtl-info">
                <td colspan="2"></td>
                <td>Effective UTC offset: <input class="inline" id="epoch-to-time-tz-offset" type="text" readonly /> mins</td>
              </tr>
            </table>
            <p id="epoch-to-time-error" class="error-msg"></p>
          </section>
        `,
        inlineStyle: stripIndent`
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
          }
          body, input, select {
            font-family: monospace;
          }
          h1 {
            margin: 0.3em 1em;
            color: #999;
          }
          section {
            font-size: 1.3em;
            margin: 1em;
            padding: 1em;
            background-color: rgba(200, 200, 200, 0.3);
            width: 40em;
          }
          input {
            box-sizing: border-box;
            background-color: #222;
            color: #fff;
            font-size: 1em;
            padding: 0.3em 0.5em;
            border: 1px solid #999;
          }
          input[readonly] {
            border-width: 0;
            background-color: #555;
            font-family: inherit;
            color: #fff;
          }
          select {
            background-color: #222;
            color: #fff;
            font-size: 1em;
            border: 1px solid #999;
            padding: 0.3em 0.5em;
          }

          table {
            width: 100%;
          }
          table th {
            text-align: left;
            font-weight: normal;
          }
          table input:not(.inline) {
            width: 100%;
          }
          .addtl-info td {
            padding-left: 0.9em;
          }

          #current-epoch {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
          }

          input.epoch {
            font-size: 1.3em;
            text-align: center;
          }
          input.inline {
            width: 4em;
            text-align: center;
          }

          #output-format-select {
            width: 100%;
          }

          .error-msg {
            color: #f33;
          }

          @media (min-width: 1000px) {
            body {
              font-size: 1.15em;
            }
          }
          @media (max-width: 600px) {
            body {
              font-size: 0.8em;
              padding: 1em 0.5em;
            }
          }
        `,
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          const currentEpoch = document.querySelector('#current-epoch input');
          let isCurrentFocused = false;
          const updateCurrent = () => {
            if (!isCurrentFocused) {
              currentEpoch.value = Math.round(+new Date() / 1000);
            }
          };
          setInterval(updateCurrent, 1000);
          updateCurrent();

          currentEpoch.addEventListener('focus', () => {
            isCurrentFocused = true;
            currentEpoch.setSelectionRange(0, -1);
          });
          currentEpoch.addEventListener('blur', () => {
            isCurrentFocused = false;
            updateCurrent();
          });


          const inputEpoch = document.querySelector('#input-epoch-box');
          const outputFormatSelect = document.querySelector('#output-format-select');
          const outputTimeLocal = document.querySelector('#epoch-to-time-local');
          const outputTimeUtc = document.querySelector('#epoch-to-time-utc');
          const outputTimeTz = document.querySelector('#epoch-to-time-tz');
          const outputTimeTzOffset = document.querySelector('#epoch-to-time-tz-offset');
          const outputTzSelect = document.querySelector('#output-tz-select');
          const epochError = document.querySelector('#epoch-to-time-error');

          const focusHandler = evt => evt.target.setSelectionRange(0, -1);
          inputEpoch.addEventListener('focus', focusHandler);
          outputTimeLocal.addEventListener('focus', focusHandler);
          outputTimeUtc.addEventListener('focus', focusHandler);
          outputTimeTz.addEventListener('focus', focusHandler);
          outputTimeTzOffset.addEventListener('focus', focusHandler);

          const parseEpoch = inputStr => {

            // check for simple integers
            if (inputStr.match(/^\\d+$/)) {
              const inputInt = parseInt(inputStr);

              // go by number of digits
              switch (inputStr.length) {
                // seconds
                case 10:
                  return inputInt * 1000;
                // millis
                case 13:
                  return inputInt;
                // micros - JS will trim precision
                case 16:
                  return inputInt / 1000;
              }
              throw new Error("Epoch timestamps with "+inputStr.length+" digits doesn't make sense");
            }

            if (inputStr.length) {
              throw new Error("Epoch timestamp wasn't an integer, I don't understand");
            }
          };
          const fromEpoch = () => {
            try {
              epochError.innerText = '';
              const milliSeconds = parseEpoch(inputEpoch.value.trim());
              if (milliSeconds) {
                const format = outputFormatSelect.value;
                outputTimeLocal.value = moment(milliSeconds).format(format);
                outputTimeUtc.value = moment(milliSeconds).utc().format(format);

                const tzMoment = moment(milliSeconds).tz(outputTzSelect.value);
                outputTimeTz.value = tzMoment.format(format);
                outputTimeTzOffset.value = tzMoment.utcOffset();
              } else {
                outputTimeLocal.value = '';
                outputTimeUtc.value = '';
                outputTimeTz.value = '';
              }
            } catch (err) {
              epochError.innerText = err.message;
            }
          };
          inputEpoch.addEventListener('input', fromEpoch);
          inputEpoch.addEventListener('paste', evt => {
            evt.target.value = '';
          });

          moment.tz.names().forEach(name => {
            const opt = document.createElement('option');
            opt.text = name;
            opt.value = name;
            outputTzSelect.add(opt);
          });
          outputTzSelect.value = moment.tz.guess();
          outputTzSelect.addEventListener('input', fromEpoch);

          outputFormatSelect.addEventListener('input', fromEpoch);

          // if the browser didn't restore into the box, let's set a default
          if (!inputEpoch.value) {
            inputEpoch.value = Math.round(new Date()/1000);
            fromEpoch();
          }

          await distApp.reportReady();
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'urlencode',
    title: 'URLEncoder',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
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
        headTitle: 'url encode/decode tool',
        bodyHtml: stripIndent(html)`
          <h1>&#128104;&#8205;&#128187; url encode/decode tool</h1>

          <form id="decode">
            <textarea class="left" name="encoded" placeholder="url encoded"></textarea>
            <button type="submit">Decode!</button>
            <textarea class="right" name="decoded" placeholder="decoded"></textarea>
            <textarea class="right" name="bytes" placeholder="decoded component"></textarea>
          </form>

          <form id="encode">
            <textarea class="left" name="decoded" placeholder="plain text"></textarea>
            <button type="submit">Encode!</button>
            <textarea class="right" name="encoded" placeholder="encoded"></textarea>
            <textarea class="right" name="bytes" placeholder="component-encoded"></textarea>
          </form>
        `,
        inlineStyle: stripIndent`
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
              evt.target.decoded.value = decodeURI(encoded);
              evt.target.bytes.value = decodeURIComponent(encoded);
            } catch (err) {
              alert(err);
            }
          });

          document.querySelector('#encode').addEventListener('submit', evt => {
            try {
              evt.preventDefault();
              const decoded = evt.target.decoded.value;
              evt.target.encoded.value = encodeURI(decoded);
              evt.target.bytes.value = encodeURIComponent(decoded);
            } catch (err) {
              alert(err);
            }
          });

          await distApp.reportReady();
        `,
      },
    },
  },
// }, {
//   apiVersion: 'manifest.dist.app/v1alpha1',
//   kind: 'Activity',
//   metadata: {
//     name: 'jwt',
//     title: 'JWT inspector',
//   },
//   spec: {
//     implementation: {
//       type: 'iframe',
//       sandboxing: ['allow-scripts', 'allow-forms'],
//       source: {
//         type: 'piecemeal',
//         htmlLang: 'en',
//         metaCharset: 'utf-8',
//         headTitle: 'jwt inspector tool',
//         bodyHtml: stripIndent(html)`
//           <h1>&#128104;&#8205;&#128187; jwt inspector tool</h1>

//         `,
//         inlineStyle: stripIndent`
//         `,
//         inlineScript: stripIndent(html)`
//           const distApp = await DistApp.connect();

//           await distApp.reportReady();
//         `,
//       },
//     },
//   },
});
