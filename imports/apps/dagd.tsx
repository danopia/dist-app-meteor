// ---
// kind: Namespace
// metadata:
//   name: default
// spec:
//   export: true
// ---
// kind: DistApp
// metadata:
//   name: app
//   namespace: default
//   description: da.gd query tool
// spec:
//   iconRef:
//     kind: Blob
//     name: icon
// ---
// kind: Blob
// metadata:
//   name: icon
//   namespace: default
// spec:
//   inline: <svg>...
// ---
// kind: Activity
// metadata:
//   name: launch
//   namespace: default
// spec:
//   intentFilters:
//   - action: Main
//     category: Launcher
//   implementationRefs:
//   - namespace: webapp
//     kind: Iframe
//     name: app


// ---
// kind: Namespace
// metadata:
//   name: webapp
// ---
// kind: Iframe
// metadata:
//   name: app
//   namespace: webapp
// spec:
//   documentRef:
//     kind: Blob
//     name: html-document
//   ipcProtocols:
//   - FrameEvents/v1beta1
//   ipcFeatures:
//   - fetch
//   sandboxFlags:
//   - allow-scripts
// ---
// kind: Blob
// metadata:
//   name: html-document
//   namespace: webapp
// spec:
//   inlineText: |
//     <!doctype html>

//     <title>da.gd tool</title>

//     <style type="text/css">
//       body {
//         background-color: #333;
//         color: #fff;
//         margin: 0;
//         padding: 0 2em;
//         display: flex;
//         flex-direction: column;
//         height: 100vh;
//         box-sizing: border-box;
//       }
//       body, input, select, button {
//         font-family: monospace;
//       }
//       h1 {
//         margin: 0.3em 1em;
//         color: #999;
//       }
//       section {
//         font-size: 1.3em;
//         margin: 1em;
//         padding: 1em;
//         background-color: rgba(200, 200, 200, 0.3);
//       }
//       input, textarea {
//         box-sizing: border-box;
//         background-color: #222;
//         color: #fff;
//         font-size: 1em;
//         padding: 0.3em 0.5em;
//         border: 1px solid #999;
//         overflow-y: hidden;
//       }
//       input[readonly], textarea[readonly] {
//         border-width: 0;
//         background-color: #555;
//         font-family: inherit;
//         color: #fff;
//       }
//       button {
//         background-color: #444;
//         color: #fff;
//         font-size: 0.9em;
//         border: 1px solid #666;
//         padding: 0.2em 0.7em;
//         margin-top: 0.3em;
//         text-align: left;
//         flex: 1;
//       }
//       .multi-button {
//         display: flex;
//       }
//       .multi-button .alt-button {
//         flex: 0 1;
//       }

//       @media (min-width: 800px) {
//         #app {
//           display: flex;
//           flex: 1;
//         }
//         #action-col {
//           flex-basis: 30em;
//           overflow-y: auto;
//           padding: 2em 0;
//         }
//         #history-col {
//           flex-basis: 50em;
//           flex: 1;
//           overflow-y: scroll;
//           padding-top: 5em;
//           height: 100vh;
//           box-sizing: border-box;
//         }
//       }

//       h3 {
//         margin: 0.2em 0 0.4em;
//       }
//       h3:not(:first-child) {
//         padding-top: 1.2em;
//       }
//       a.deeplink {
//         margin-right: 0.4em;
//       }
//       h4 {
//         display: inline;
//         margin: 0em 0 0.2em;
//       }
//       .get-attribute {
//         display: flex;
//         flex-direction: column;
//       }
//       .entry textarea {
//         width: 100%;
//         resize: vertical;
//       }
//       .error-msg {
//         color: #f33 !important;
//       }
//       a {
//         color: #ccc;
//       }

//     </style>

//     <div id="app">
//       <div id="action-col">
//         <h1>👨‍💻 da.gd query tool</h1>

//         <section class="get-attribute">
//           <h3>Attribute Lookup</h3>
//           <button data-query="attr" data-path="/ua">User-Agent</button>
//           <button data-query="attr" data-path="/headers">Request Headers</button>

//           <div class="multi-button">
//             <button data-query="attr" data-path="/ip">IP Address</button>
//             <button data-query="attr" data-path="/ip"
//                     data-proto="4" class="alt-button">IPv4</button>
//             <button data-query="attr" data-path="/ip"
//                     data-proto="6" class="alt-button">IPv6</button>
//             <!--button data-query="attr" data-path="/ip"
//                     data-proto="wg69" class="alt-button">wg69</button-->
//           </div>

//           <div class="multi-button">
//             <button data-query="attr" data-path="/isp">ISP Name</button>
//             <button data-query="attr" data-path="/isp"
//                     data-proto="4" class="alt-button">IPv4</button>
//             <button data-query="attr" data-path="/isp"
//                     data-proto="6" class="alt-button">IPv6</button>
//             <!--button data-query="attr" data-path="/isp"
//                     data-proto="wg69" class="alt-button">wg69</button-->
//           </div>


//           <h3>Name Queries</h3>
//           <input id="input-name" type="text" autofocus required
//                 placeholder="hostname or IP address" />
//           <button data-query="name" data-path="/w" data-input="#input-name">WHOIS</button>
//           <button data-query="name" data-path="/host" data-input="#input-name">Resolve Host</button>
//           <button data-query="name" data-path="/dns" data-input="#input-name">DNS Query</button>
//           <button data-query="name" data-path="/isp" data-input="#input-name">ISP Name</button>


//           <h3>URL Queries</h3>
//           <input id="input-url" type="text" autofocus required
//                 placeholder="url, hostname, or IP address" />
//           <button data-query="url" data-path="/up" data-input="#input-url">HTTP check</button>
//           <button data-query="url" data-path="/headers" data-input="#input-url">Response Headers</button>
//         </section>
//       </div>

//       <div id="history-col">
//         <section class="intro">
//           <a href="https://da.gd">powered by da.gd</a>
//         </section>
//       </div>
//     </div>

//     <script type="text/javascript">

//       const historyCol = document.querySelector('#history-col');
//       function addEntry (action) {

//         const title = document.createElement('h4');
//         const progress = document.createElement('progress');
//         const output = document.createElement('textarea');
//         output.readOnly = true;
//         output.rows = 1;
//         const time = document.createElement('time');

//         const headbox = document.createElement('div');
//         headbox.classList.add('entry-head');
//         headbox.appendChild(title);

//         const box = document.createElement('section');
//         box.classList.add('entry');
//         box.appendChild(headbox);
//         box.appendChild(progress);
//         historyCol.insertBefore(box, historyCol.children[0]);

//         const finalizeBox = () => {
//           box.removeChild(progress);

//           box.appendChild(output);
//           box.appendChild(time);
//           setTimeout(() => {
//             output.style.height = output.scrollHeight+'px';
//           }, 0);
//         }

//         return {
//           deeplink(path) {
//             const deeplink = document.createElement('a');
//             deeplink.href = 'https://da.gd/ui#' + encodeURI(path);
//             deeplink.innerText = '#';
//             deeplink.classList.add('deeplink');
//             headbox.insertBefore(deeplink, title);
//           },
//           title(text) { title.innerText = text; },
//           promise(p) {
//             p.then(text => {
//               output.value = text.trim();
//               finalizeBox();
//             }, err => {
//               output.classList.add('error-msg');
//               output.value = err.message || JSON.stringify(err, null, 2);
//               finalizeBox();
//             });
//           },
//         };
//       };

//       const inputName = document.querySelector('#input-name');
//       const inputUrl = document.querySelector('#input-url');

//       function doAction (action) {
//         var entry = addEntry(action.query);

//         switch (action.query) {
//           case 'attr':
//             var proto = 'https';
//             var hostname = 'da.gd';
//             var title = 'attribute query: '+action.path;
//             if (action.proto === 'wg69') {
//               proto = 'http';
//               hostname = 'dagd.rick.tun.wg69.net';
//               title += ` (using wg69 VPN)`;
//             } else if (action.proto) {
//               hostname = action.proto + '.' + hostname;
//               title += ` (using IPv${action.proto})`;
//             }

//             entry.deeplink(action.path);
//             entry.title(title);
//             entry.promise(
//               fetch(proto+'://'+hostname+action.path)
//               .then(x => x.text()));
//             break;

//           case 'name':
//             let name;
//             try {
//               name = cleanName(inputName.value);
//             } catch (err) {
//               return entry.promise(Promise.reject(err));
//             }

//             entry.deeplink(action.path+'/'+name);
//             entry.title('name query: '+action.path+'/'+name);
//             if (name) {
//               entry.promise(
//                 fetch('https://da.gd'+action.path+'/'+name)
//                 .then(x => x.text()));
//             } else {
//               entry.promise(
//                 Promise.reject(new Error('Name is required')));
//               inputName.focus();
//             }
//             break;

//           case 'url':
//             const url = inputUrl.value;
//             entry.deeplink(action.path+'/'+url);
//             entry.title('url query: '+action.path+'/'+url);
//             if (url) {
//               entry.promise(
//                 fetch('https://da.gd'+action.path+'/'+url)
//                 .then(x => x.text()));
//             } else {
//               entry.promise(
//                 Promise.reject(new Error('URL is required')));
//               inputUrl.focus();
//             }
//             break;

//           default:
//             entry.title('action: '+action);
//             entry.promise(
//               Promise.reject('Unknown client action'));
//             break;
//         }
//       }

//       document.addEventListener("click", event => {
//         var element = event.target;
//         while (element) {
//           if (element.nodeName === 'BUTTON' && 'query' in element.dataset) {
//             return doAction(element.dataset);
//           }
//           element = element.parentNode;
//         }
//       }, false);

//       function cleanName(input) {
//         // clean up a URL into a name
//         if (input.includes('://')) {
//           let match = input.match(/:\/\/([^:\/]+)/);
//           if (match && confirm(
//     `I cleaned that URI you gave me into a hostname.\n
//     Input: ${input}
//     Cleaned: ${match[1]}\n
//     Sound good, boss?`)) {
//             return match[1];
//           }
//         }

//         if (input.includes('/') || !(input.match(/[:.]/))) {
//           alert(`That input you gave me doesn't look like a DNS name or IP address. Wanna try again?`);
//           throw new Error(`Couldn't understand ${JSON.stringify(input)} as a name, selfishly refusing to send to dagd`);
//         }

//         return input;
//       }

//       function doActionForUrl (url) {
//         const [_, path, ...arg] = url.split('/');
//         if (!path || !path.length === 0) return;

//         let selector = `button[data-query][data-path="/${path}"]`;
//         if (arg.length > 0) selector += `[data-input]`;

//         const button = document.querySelector(selector);
//         if (!button) return;

//         if (button.dataset.input) {
//           const inputBox = document.querySelector(button.dataset.input);
//           if (!inputBox) return;
//           inputBox.value = arg.join('/');
//           setTimeout(function () {
//             inputBox.focus();
//           }, 1);
//         }

//         button.click();
//       }

//       const hash = window.location.hash;
//       if (hash && hash.length > 1) {
//         doActionForUrl(hash.slice(1));
//       }

//     </script>
