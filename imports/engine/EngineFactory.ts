// import { ActivityEntity } from "../entities/manifest";
import { Random } from "meteor/random";
import { AppInstallationEntity } from "../entities/profile";
import { CommandEntity, FrameEntity } from "../entities/runtime";
import { EntityEngine } from "./EntityEngine";
import { StaticCatalogs } from "./StaticCatalogs";

export function insertGuestTemplate(engine: EntityEngine) {
  for (const defaultNamespace of StaticCatalogs.keys()) {
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
