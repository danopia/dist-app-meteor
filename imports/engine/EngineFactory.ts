// import { ActivityEntity } from "../entities/manifest";
import { Random } from "meteor/random";
import { AppInstallationEntity } from "../entities/profile";
import { CommandEntity, FrameEntity } from "../entities/runtime";
import { injectTraceAnnotations } from "../lib/tracing";
import { EntityEngine } from "./EntityEngine";
import { GuestCatalogs } from "./StaticCatalogs";

export function newEngineWithGuestProfile() {
  const runtime = new EntityEngine();

  runtime.addNamespace({
    name: 'session',
    spec: {
      layers: [{
        mode: 'ReadWrite',
        accept: [{
          apiGroup: 'runtime.dist.app',
        }],
        storage: {
          type: 'local-inmemory',
        },
      }],
    }});

  runtime.addNamespace({
    name: 'profile:guest',
    spec: {
      layers: [{
        mode: 'ReadWrite',
        accept: [{
          apiGroup: 'profile.dist.app',
        }],
        storage: {
          type: 'local-inmemory',
        },
      }],
    }});
  insertGuestProfileTemplate(runtime);

  return runtime;
}

export function insertGuestProfileTemplate(engine: EntityEngine) {
  for (const defaultNamespace of GuestCatalogs) {
    if (!defaultNamespace.startsWith('app:')) continue;
    engine.insertEntity<AppInstallationEntity>({
      apiVersion: 'profile.dist.app/v1alpha1',
      kind: 'AppInstallation',
      metadata: {
        name: `bundledguestapp-${defaultNamespace}`,
        namespace: 'profile:guest',
      },
      spec: {
        appUri: `bundled:${encodeURIComponent(defaultNamespace)}`,
        // isInLauncher: true,
        launcherIcons: [{
          action: 'app.dist.Main',
        }],
        preferences: {},
      },
    });
  }
}

export function insertGuestWelcomeSession(engine: EntityEngine) {
  // const workspaceName = Random.id();

  // Add a latent command telling the runtime to process a particular intent
  // when it first starts running (and then not again)
  const launchCmd = 'launch-welcome-'+Random.id(4);
  engine.insertEntity<CommandEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Command',
    metadata: {
      name: launchCmd,
      namespace: 'session',
      annotations: injectTraceAnnotations(),
    },
    spec: {
      type: 'launch-intent',
      intent: {
        receiverRef: "entity://profile:guest/profile.dist.app@v1alpha1/AppInstallation/bundledguestapp-app:welcome",
        action: "app.dist.Main",
        category: "app.dist.Launcher",
        // action: 'app.dist.FTUE',
        // category: 'app.dist.Default',
        // TODO: seems like there needs to be a better way to refer to a particular foreign application.
        // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
      }
    },
  });

  // TODO: we currently need to create a frame that "runs" the command
  //   The command makes the real frame and deletes this "command" frame
  //   Instead, commands should run (and appear in UI) without a full-ass Frame
  engine.insertEntity<FrameEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Frame',
    metadata: {
      name: launchCmd,
      namespace: 'session',
    },
    spec: {
      contentRef: '../Command/'+launchCmd,
      placement: {
        current: 'floating',
        grid: {
          area: 'fullscreen',
        },
        floating: {
          left: 200,
          top: 200,
        },
        rolledWindow: false,
      },
    },
  });
}
