import { html, stripIndent } from "common-tags";
import { useVueState } from "./_vue";
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
          #tool-list {
            list-style: none;
            padding: 0;
            margin: 1em;
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
            'google-dns.html',
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
            distApp.launchIntent({
              receiverRef: 'Activity/'+href,
              // activity: {
              //   name: href,
              // },
            });
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
    title: 'AWS Region Resolver',
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
      sandboxing: ['allow-scripts', 'allow-forms', 'allow-modals'],
      securityPolicy: {
        connectSrc: ['https://ip-ranges.amazonaws.com', 'https://raw.githubusercontent.com', 'https://da.gd'],
      },
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'AWS IPs',
        bodyHtml: stripIndent(html)`
          <form id="lookup">
            <input type="text" name="ipaddr" placeholder="Paste an IP address, hostname, or URL" required autofocus>
            <button type="submit">Lookup</button>
          </form>

          <div id="history-col">
            <section class="intro">
              <ul>
                <li><strong>example lookups</strong></li>
                <li><a href="#" onClick="go('amazon.com')">amazon.com</a> (the online store)</li>
                <li><a href="#" onClick="go('console.aws.amazon.com')">console.aws.amazon.com</a></li>
                <li><a href="#" onClick="go('status.aws.amazon.com')">status.aws.amazon.com</a></li>
                <li><a href="#" onClick="go('slack.com')">slack.com</a> (CloudFront)</li>
                <li><a href="#" onClick="go('api.spotify.com')">api.spotify.com</a> (Google Cloud)</li>
                <li><a href="#" onClick="go('heroku.com')">heroku.com</a></li>
                <li><a href="#" onClick="go('github.scopely.io')">github.scopely.io</a> (dual region!)</li>
                <li><a href="#" onClick="go('collector.scopely.io')">collector.scopely.io</a> (IPv6)</li>
                <li><a href="#" onClick="go('bethesda.net')">bethesda.net</a> (CloudFront)</li>
                <li><a href="#" onClick="go('cloudycluster.com')">cloudycluster.com</a> (S3)</li>
                <li><a href="#" onClick="go('cloudping.co')">cloudping.co</a></li>
                <li><a href="#" onClick="go('pepedev.com')">pepedev.com</a></li>
                <li><a href="#" onClick="go('status.github.com')">status.github.com</a></li>
                <li><a href="#" onClick="go('en.wikipedia.org')">en.wikipedia.org</a> (non-AWS)</li>
                <li><a href="#" onClick="go('8.8.8.8')">Cloudflare DNS</a> (non-AWS)</li>
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
              padding: 0 0 10em;
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
          ${useVueState}

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

            if (andSetHash) {
              setState('input', input.text);
            }

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
            setState('input', rawInput);
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

          globalThis.go = (str) => {
            queryInput(ParseInput(str), true);
          };

          getState('input').then(rawInput => {
            if (rawInput) {
              queryInput(ParseInput(rawInput), false);
            }
          }).finally(() => distApp.reportReady());
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'base64',
    title: 'Base64 encode/decode tool',
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
      sandboxing: ['allow-scripts', 'allow-forms', 'allow-modals'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'base64 tool',
        bodyHtml: stripIndent(html)`
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
          ${useVueState}

          function rawToBytes(raw) {
            const bytes = [];
            for (var i = 0; i < raw.length; i++) {
              bytes.push(raw.codePointAt(i));
            }
            return bytes.map(x => x.toString(16)).join(' ');
          }

          document.querySelector('#decode').addEventListener('submit', evt => {
            evt.preventDefault();
            setState('decode-input', evt.target.encoded.value);
            runDecode(evt.target);
          });
          function runDecode(form) {
            const encoded = form.encoded.value;
            const decoded = atob(encoded);
            form.decoded.value = decoded;
            form.bytes.value = rawToBytes(decoded);
          }

          document.querySelector('#encode').addEventListener('submit', evt => {
            evt.preventDefault();
            setState('encode-input', evt.target.decoded.value);
            runEncode(evt.target);
          });
          function runEncode(form) {
            const decoded = form.decoded.value;
            const encoded = btoa(decoded);
            form.encoded.value = encoded;
            form.bytes.value = rawToBytes(decoded);
          }

          const loads = [
            getState('decode-input').then(value => {
              if (value) {
                const form = document.querySelector('form#decode');
                form.encoded.value = value;
                runDecode(form);
              }
            }),
            getState('encode-input').then(value => {
              if (value) {
                const form = document.querySelector('form#encode');
                form.decoded.value = value;
                runEncode(form);
              }
            }),
            getState('display-format').then(value => {
              if (value) {
                outputFormatSelect.value = value;
              }
            }),
          ];
          Promise.all(loads).finally(() => distApp.reportReady());
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'jwt',
    title: 'JWT inspector tool',
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
      sandboxing: ['allow-scripts', 'allow-forms', 'allow-modals'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'jwt inspector tool',
        bodyHtml: stripIndent(html)`
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
          ${useVueState}

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
            setState('input', stripSignature(jwtBox.value));
            decodeJWT(jwtBox.value);
          });

          jwtBox.focus();
          jwtBox.addEventListener('paste', evt => {
            jwtBox.value = '';
            const pasteText = evt.clipboardData.getData('text');
            setState('input', stripSignature(pasteText));
            decodeJWT(pasteText);
          });

          function stripSignature(jwt) {
            return jwt.split('.').slice(0,2).concat('[signature_redacted]').join('.');
          }

          getState('input').then(input => {
            if (input) {
              jwtBox.value = input;
              // TODO: should the output box have its own storage?
              decodeJWT(input);
            }
          }).finally(() => distApp.reportReady());
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'pretty-json',
    title: 'JSON formatter tool',
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
      sandboxing: ['allow-scripts', 'allow-forms', 'allow-modals'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'json formatter tool',
        bodyHtml: stripIndent(html)`
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
          ${useVueState}

          const inputBox = document.querySelector('[name=input]');
          const outputBox = document.querySelector('[name=output]');
          const form = document.querySelector('form');

          function prettify(raw) {
            var input = JSON.parse(raw);

            // if user pasted JSON-encoded string, try parsing it as an object
            // useful feature when extracting JSON from a parent JSON document
            if (input.constructor === String) {
              // TODO: nicer messaging
              // alert("Automatically parsing contents of JSON string as JSON");
              input = JSON.parse(input);
            }

            outputBox.value = JSON.stringify(input, null, 2);
          }

          form.addEventListener('submit', evt => {
            evt.preventDefault();
            prettify(inputBox.value);
            setState('input', inputBox.value);
          });

          inputBox.focus();
          inputBox.addEventListener('paste', evt => {
            inputBox.value = '';
            const pasteText = evt.clipboardData.getData('text');
            prettify(pasteText);
            setState('input', pasteText);
          });

          getState('input').then(input => {
            if (input) {
              inputBox.value = input;
              // TODO: should the output box have its own storage?
              prettify(input);
            }
          }).finally(() => distApp.reportReady());
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
      sandboxing: ['allow-scripts'],
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
          ${useVueState}

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
                  return inputInt * 1_000;
                // millis
                case 13:
                  return inputInt;
                // micros - JS will trim precision
                case 16:
                  return inputInt / 1_000;
                // nanos - JS will trim precision
                case 19:
                  return inputInt / 1_000_000;
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
          inputEpoch.addEventListener('input', () => {
            setState('input', inputEpoch.value);
            fromEpoch();
          });
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
          outputTzSelect.addEventListener('input', () => {
            setState('display-tz', outputTzSelect.value);
            fromEpoch();
          });

          outputFormatSelect.addEventListener('input', () => {
            setState('display-format', outputFormatSelect.value);
            fromEpoch();
          });

          const loads = [
            getState('input').then(input => {
              if (input) {
                inputEpoch.value = input;
              }
            }),
            getState('display-tz').then(tz => {
              if (tz) {
                outputTzSelect.value = tz;
              }
            }),
            getState('display-format').then(value => {
              if (value) {
                outputFormatSelect.value = value;
              }
            }),
          ];
          Promise.all(loads).finally(() => {

            // if the browser didn't restore into the box, let's set a default
            if (!inputEpoch.value) {
              inputEpoch.value = Math.round(new Date()/1000);
              setState('input', inputEpoch.value);
            }

            fromEpoch();

            distApp.reportReady();
          });
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'urlencode',
    title: 'URL encode/decode tool',
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
      sandboxing: ['allow-scripts', 'allow-forms', 'allow-modals'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'url encode/decode tool',
        bodyHtml: stripIndent(html)`
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
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'ApiBinding',
  metadata: {
    name: 'google-dns',
  },
  spec: {
    apiName: 'google-dns',
    required: false,
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'google-dns',
    title: 'Google DNS Query',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
    icon: {
      type: 'svg',
      svg: {
        backgroundColor: '#fff',
        textData: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
          </g>
        </svg>`,
      },
    },
    windowSizing: {
      initialWidth: 800,
      initialHeight: 500,
    },
    implementation: {
      type: 'iframe',
      sandboxing: ['allow-scripts', 'allow-forms', 'allow-modals'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'Google DNS',
        bodyHtml: stripIndent(html)`
          <form id="lookup">
            <select name="type">
            </select>
            <input type="text" name="name" placeholder="Hostname, FQDN, etc" required autofocus>
            <button type="submit">Lookup</button>
          </form>

          <div id="history-col">
            <section class="footer">
              <div>
                toolbelt tools by
                <a target="_new" href="https://github.com/danopia">@danopia</a>
              </div>
              <div>
                DNS resolution by
                <a target="_blank" href="https://developers.google.com/speed/public-dns/docs/doh/json">Google Public DNS</a>
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
          form {
            display: grid;
            grid-template-columns: 8em 1fr 8em;
            grid-gap: 1em;
            grid-auto-rows: 3em;
            margin: 1em;
          }
          select, input, textarea {
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
            /*font-size: 1.3em;*/
            margin: 0.8em;
            padding: 1em;
            background-color: rgba(200, 200, 200, 0.3);
            overflow-x: auto;
          }
          .entry-head {
            padding: 0 0 0.3em;
          }
          @media (max-width: 800px) {
            body {
              padding: 0 0 10em;
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

          .result-wrap table {
            min-width: min(75%,50em);
            margin: 0 auto;
          }
          .result-wrap th, .result-wrap td {
            padding: 0.25em 0.5em;
          }
        `,
        inlineScript: stripIndent(html)`
          const primaryTypes = new Set([
            'A', 'AAAA', 'MX', 'TXT',
          ]);
          const secondaryTypes = new Set([
            'NS', 'CNAME', 'SRV', // normal but uncommon
            'PTR', // reverse dns
            'SSHFP', // ssh host key fingerprint
            'CAA', // tls issuance policy
          ]);
          const rrsetTypes = new Map([
            [1, 'A'],
            [2, 'NS'],
            [5, 'CNAME'],
            [6, 'SOA'],
            [12, 'PTR'],
            [13, 'HINFO'],
            [15, 'MX'],
            [16, 'TXT'],
            [17, 'RP'],
            [18, 'AFSDB'],
            [24, 'SIG'],
            [25, 'KEY'],
            [28, 'AAAA'],
            [29, 'LOC'],
            [33, 'SRV'],
            [35, 'NAPTR'],
            [36, 'KX'],
            [37, 'CERT'],
            [39, 'DNAME'],
            [42, 'APL'],
            [43, 'DS'],
            [44, 'SSHFP'],
            [45, 'IPSECKEY'],
            [46, 'RRSIG'],
            [47, 'NSEC'],
            [48, 'DNSKEY'],
            [49, 'DHCID'],
            [50, 'NSEC3'],
            [51, 'NSEC3PARAM'],
            [52, 'TLSA'],
            [53, 'SMIMEA'],
            [55, 'HIP'],
            [59, 'CDS'],
            [60, 'CDNSKEY'],
            [61, 'OPENPGPKEY'],
            [62, 'CSYNC'],
            [63, 'ZONEMD'],
            [64, 'SVCB'],
            [65, 'HTTPS'],
            [108, 'EUI48'],
            [109, 'EUI64'],
            [249, 'TKEY'],
            [250, 'TSIG'],
            [256, 'URI'],
            [257, 'CAA'],
            [32768, 'TA'],
            [32769, 'DLV'],
          ]);

          const select = document.querySelector('select[name=type]');
          const primaryGroup = document.createElement('optgroup');
          primaryGroup.label = "Most Common";
          const secondaryGroup = document.createElement('optgroup');
          secondaryGroup.label = "Less Common";
          select.append(primaryGroup, secondaryGroup);
          for (const [num, name] of rrsetTypes.entries()) {
            const option = document.createElement('option');
            option.innerText = name;
            option.value = num.toString();
            if (primaryTypes.has(name)) {
              primaryGroup.appendChild(option);
            } else if (secondaryTypes.has(name)) {
              secondaryGroup.appendChild(option);
            } else {
              select.appendChild(option);
            }
          }

          const distApp = await DistApp.connect();

          const historyCol = document.querySelector('#history-col');
          function addEntry () {

            const title = document.createElement('h4');
            const progress = document.createElement('progress');

            const headbox = document.createElement('div');
            headbox.classList.add('entry-head');
            headbox.appendChild(title);

            const box = document.createElement('section');
            box.classList.add('entry');
            box.appendChild(headbox);
            box.appendChild(progress);
            historyCol.insertBefore(box, historyCol.children[0]);

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
                return p.then(child => {
                  box.removeChild(progress);
                  box.appendChild(child);
                }, err => {
                  const output = document.createElement('textarea');
                  output.readOnly = true;
                  output.rows = 1;
                  output.classList.add('error-msg');
                  output.value = err.message || JSON.stringify(err, null, 2);

                  box.removeChild(progress);
                  box.appendChild(output);
                  setTimeout(() => {
                    output.style.height = output.scrollHeight+'px';
                  }, 0);
                });
              },
            };
          };

          function ParseInput(rawInput) {
            const v4Match = rawInput.match(/((?:\\d{1,3}\\.){3}\\d{1,3})(\\/|:|$)/);
            if (v4Match) {
              return {
                text: v4Match[1].toLowerCase(),
                nameType: 'ipv4',
              };
            } else {
              return {
                text: rawInput,
                nameType: 'dns',
              };
            }
          }

          function queryInput(input, andSetHash=false) {
            const entry = addEntry();
            entry.title(input.type + ' ' + input.text);

            return entry.promise((async () => {

              // Rejack any IPv4 queries into reverse-IP queries
              if (input.nameType == 'ipv4') {
                input = {
                  type: 'PTR',
                  nameType: 'dns',
                  text: input.text.split('.').reverse().join('.') + '.in-addr.arpa.',
                };
              }

              const opts = new URLSearchParams();
              opts.set('name', input.text);
              opts.set('type', input.type);
              opts.set('do', '1');
              const resp = await distApp.fetch('/ApiBinding/google-dns/resolve?'+opts.toString());
              const json = await resp.json();

              const wrap = document.createElement('div');
              wrap.classList.add('result-wrap');

              for (const tableKey of ["Question", "Answer", "Authority"]) {
                if (json[tableKey]) {
                  const label = document.createElement('h3');
                  label.innerText = tableKey;
                  wrap.appendChild(label);
                  wrap.appendChild(buildDnsTable(json[tableKey]))
                }
              }

              return wrap;
            })());
          }

          function buildDnsTable(items) {
            const table = document.createElement('table');
            table.border = 1;

            const tr = document.createElement('tr');
            for (const label of ["FQDN", "Type", "TTL", "Data"]) {
              const th = document.createElement('th');
              th.innerText = label;
              th.style.textAlign = (label == 'FQDN' || label == 'TTL') ? 'right' : 'left';
              tr.appendChild(th);
            }
            table.appendChild(tr);

            for (const item of items) {
              const tr = document.createElement('tr');
              if (item.type == 46) continue; // DNSSEC signature
              for (const field of ["name", "type", "TTL", "data"]) {
                const td = document.createElement('td');
                if (item[field] != null) {
                  td.innerText = item[field];
                  if (field == 'type') td.innerText = rrsetTypes.get(item[field]) ?? td.innerText;
                  if (field == 'TTL') td.innerText = secondsToTime(item[field]).toString();
                }
                td.style.textAlign = (field == 'name' || field == 'TTL') ? 'right' : 'left';
                if (field == 'name' || field == 'data') td.style.minWidth = '10em';
                tr.appendChild(td);
              }
              table.appendChild(tr);
            }

            return table;
          }

          function secondsToTime(secs) {
            const minutes = Math.floor(secs / 60);
            if (minutes == 0) return [secs, 's'].join('');
            const hours = Math.floor(minutes / 60);
            if (hours == 0) return [minutes, 'm', secs-(minutes*60), 's'].join('');
            return [hours, 'h', minutes-(hours*60), 'm', secs-(minutes*60), 's'].join('');
          }

          const form = document.querySelector('form');
          form.addEventListener('submit', evt => {
            evt.preventDefault();
            const {name, type} = evt.target;
            queryInput({...ParseInput(name.value), type: type.value});
          });

          const inputBox = form.name;
          inputBox.addEventListener('paste', evt => {
            try {
              const pasteData = evt.clipboardData.getData('text');
              queryInput({...ParseInput(pasteData), type: form.type.value});
            } catch (err) {
              console.log('not acting on paste.', err);
            }
          });

          await distApp.reportReady();
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Api',
  metadata: {
    name: 'google-dns',
    links: [{
      url: 'https://developers.google.com/speed/public-dns/docs/doh/json',
      type: 'documentation',
    }],
  },
  spec: {
    type: 'openapi',
    crossOriginResourceSharing: 'open',
    definition: stripIndent`
      openapi: 3.0.1
      info:
        title: Google Public DNS Resolver
        version: 2022-08-28
        description: Query DNS records from Google's closest server
      servers:
        - url: https://8.8.8.8
      paths:
        /resolve:
          get:
            parameters:
            - in: query
              name: name
              schema:
                type: string
              required: true
            - in: query
              name: type
              schema:
                type: string
              required: false
            - in: query
              name: cd
              schema:
                type: string
              required: false
            - in: query
              name: ct
              schema:
                type: string
              required: false
            - in: query
              name: do
              schema:
                type: string
              required: false
            - in: query
              name: edns_client_subnet
              schema:
                type: string
              required: false
            - in: query
              name: random_padding
              schema:
                type: string
              required: false
            responses:
              default:
                $ref: '#/components/responses/DnsResponse'
      components:
        responses:
          DnsResponse:
            description: A DNS response.
            content:
              application/x-javascript:
                schema:
                  $ref: '#/components/schemas/DnsJsonResponse'
        schemas:
          DnsJsonResponse:
            required:
            - Status
            - TC
            - RD
            - RA
            - AD
            - CD
            - Question
            properties:
              Status:
                description: Standard DNS response code (32 bit integer)
                type: integer
              TC:
                description: Whether the response is truncated
                type: boolean
              RD:
                description: Always true for Google Public DNS
                type: boolean
              RA:
                description: Always true for Google Public DNS
                type: boolean
              AD:
                description: Whether all response data was validated with DNSSEC
                type: boolean
              CD:
                description: Whether the client asked to disable DNSSEC
                type: boolean
              Question:
                type: array
                items:
                  type: object
                  required:
                  - name
                  - type
                  properties:
                    name:
                      description: FQDN with trailing dot
                      type: string
                    type:
                      description: Standard DNS RR type
                      type: integer
              Answer:
                type: array
                items:
                  type: object
                  required:
                  - name
                  - type
                  - data
                  properties:
                    name:
                      description: Always matches name in the Question section
                      type: string
                    type:
                      description: Standard DNS RR type
                      type: integer
                    TTL:
                      description: Record's time-to-live in seconds
                      type: integer
                    data:
                      description: Data for A - IP address as text
                      type: string
              Authority:
                type: array
                items:
                  type: object
                  required:
                  - name
                  - type
                  - data
                  properties:
                    name:
                      description: Always matches name in the Question section
                      type: string
                    type:
                      description: Standard DNS RR type
                      type: integer
                    TTL:
                      description: Record's time-to-live in seconds
                      type: integer
                    data:
                      description: Data for A - IP address as text
                      type: string
              Comment:
                description: Any diagnostic information
                type: string
              edns_client_subnet:
                description: IP address / scope prefix-length
                type: string
    `,
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
//       sandboxing: ['allow-scripts', 'allow-forms', 'allow-modals'],
//       source: {
//         type: 'piecemeal',
//         htmlLang: 'en',
//         metaCharset: 'utf-8',
//         headTitle: 'jwt inspector tool',
//         bodyHtml: stripIndent(html)`
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
