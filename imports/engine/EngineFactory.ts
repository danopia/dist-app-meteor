// import { ActivityEntity } from "../entities/manifest";
import { AppInstallationEntity } from "../entities/profile";
import { CommandEntity, TaskEntity, WorkspaceEntity } from "../entities/runtime";
import { EntityEngine } from "./EntityEngine";
import { StaticCatalogs } from "./StaticCatalogs";

export class EngineFactory {

  static forGuestSession() {
    const engine = new EntityEngine();

    engine.addNamespace({
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
    engine.addNamespace({
      name: 'profile',
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

    for (const defaultNamespace of StaticCatalogs.keys()) {
      if (!defaultNamespace.startsWith('app:')) continue;
      engine.insertEntity<AppInstallationEntity>({
        apiVersion: 'profile.dist.app/v1alpha1',
        kind: 'AppInstallation',
        metadata: {
          name: `bundledguestapp-${defaultNamespace}`,
          namespace: 'profile',
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
    engine.insertEntity<WorkspaceEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Workspace',
      metadata: {
        name: 'main',
        namespace: 'session',
      },
      spec: {
        windowOrder: [],
      },
    });

    // Add a latent command telling the runtime to process a particular intent
    // when it first starts running (and then not again)
    engine.insertEntity<CommandEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Command',
      metadata: {
        name: 'launch-welcome',
        namespace: 'session',
      },
      spec: {
        type: 'launch-intent',
        intent: {
          receiverRef: "entity://profile/profile.dist.app@v1alpha1/AppInstallation/bundledguestapp-app:welcome",
          action: "app.dist.Main",
          category: "app.dist.Launcher",
          // action: 'app.dist.FTUE',
          // category: 'app.dist.Default',
          // TODO: seems like there needs to be a better way to refer to a particular foreign application.
          // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
        }
      },
    });

    //TODO:
    // /:namespace/:api@:version/:kind/:name/
    // engine.fetchEntity('/session/runtime@v1alpha1/Workspace/main/rpc/launch-intent')
    // const workspace = useBase(engine, '/session/runtime@v1alpha1/Workspace/main');

    // const shell = engine.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main');
    // if (!shell) throw new Error(`no shell`);

    // const welcomeActNamespace = localStorage.welcomeAct ?? 'app:welcome';
    // const welcomeAct = engine.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', welcomeActNamespace, 'main');
    // if (!welcomeAct) throw new Error(`no welcome act`);

    // shell.createTask(welcomeAct);

    return engine;
  }
}
