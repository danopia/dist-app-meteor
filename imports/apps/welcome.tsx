import { html, stripIndent } from "common-tags";
import { Entity } from "/imports/entities";

export const WelcomeCatalog = new Array<Entity>({
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Application',
  metadata: {
    name: 'app',
    title: 'Welcome',
    description: 'First-time user experience for blank sessions',
    tags: ['poc'],
  },
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '🚀',
        backgroundColor: '#347',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'ApiBinding',
  metadata: {
    name: 'session',
    labels: {
      'keychain.dist.app/auth-mode': 'required',
    },
  },
  spec: {
    apiName: 'session.v1alpha1.dist.app',
    required: true,
    auth: {
      required: false,
      accountTypeId: 'profile.v1alpha1.dist.app',
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'main',
    title: 'Welcome Splash',
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
    }, {
      action: 'app.dist.FTUE',
      category: 'app.dist.Default',
    }],
    windowSizing: {
      minWidth: 300,
      initialWidth: 800,
      initialHeight: 400,
    },
    implementation: {
      type: 'iframe',
      sandboxing: ['allow-scripts'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'Welcome Splash',
        bodyHtml: stripIndent(html)`
          <h1>Welcome to a dist.app shell.</h1>
          <p>
            This platform offers an experimental way of launching web-based applications.
            The principles of least-privilege, stateless programming, and single-purpose program units are leveraged together to reduce individual application complexity.
          </p>
          <div class="resume-section">
            <h2>Recent Sessions</h2>
            <p>Pick up where you left off by restoring a previous session.</p>
            <ul id="resume-list"></ul>
          </div>
          <div class="guest-section">
            <p>
              This is a Guest shell, which means that the session data stays on this browser.
              Your session can be kept for next time by signing in with your Google account.
            </p>
            <p style="text-align: center;">
              <button onclick="signIn()">Sign in to dist.app</button>
            </p>
            <p>
              To try out some demo applications, please look through the on-screen app tray.
            </p>
          </div>
        `,
        inlineStyle: stripIndent`
          body:not(.has-user) .resume-section {
            display: none;
          }
          body.has-user .guest-section {
            display: none;
          }
          html {
            height: 100%;
            display: grid;
            align-content: center;
          }
          body {
            font-family: sans-serif;
            box-sizing: border-box;
            overflow-y: scroll;
            padding: 1em 10% 3em;
          }
          button {
            padding: 0.3em 1em;
            font-size: 1.2em;
            width: 50%;
            max-width: 20em;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: rgb(55, 55, 55);
              color: rgba(255, 255, 255, 0.83);
            }
            button {
              background-color: rgba(255, 255, 255, 0.1);
              color: inherit;
            }
          }
        `,
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          globalThis.signIn = () => {
            distApp.launchIntent({
              action: 'settings.AddAccount',
              // flag new_task
              extras: {
                'AccountTypes': 'v1alpha1.platform.dist.app',
              },
            });
          };

          async function updateUi() {
            // const userId = await distApp.fetch('/ApiBinding/session/current-user-id').then(x => x.text());
            // console.log({userId});

            const sessions = await distApp.fetch('/ApiBinding/session/recent-sessions').then(x => x.ok ? x.json() : null);

            if (sessions) {
              const uiList = document.querySelector('#resume-list');
              while (uiList.firstChild) uiList.removeChild(uiList.firstChild);

              document.body.classList.add('has-user');

              for (const session of sessions) {
                const button = document.createElement('button');
                button.type = 'button';
                button.addEventListener('click', () => restoreSession(session.metadata));
                button.innerText = session.metadata.title || session.metadata.name;
                const root = document.createElement('li');
                root.appendChild(button);
                uiList.appendChild(root);
              }
            } else {
              document.body.classList.remove('has-user');
            }
          }
          await updateUi();
          setTimeout(updateUi, 1000);
          setInterval(updateUi, 5000); // TODO: prevent parallel runs, also instead do proper eventing.

          async function restoreSession(metadata) {
            await distApp.fetch('/ApiBinding/session/by-name/'+metadata.name+'/restore', {
              method: 'POST',
            });
          }

          await distApp.reportReady();
        `,
      },
    },
  },
});
