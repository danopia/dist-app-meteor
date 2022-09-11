import React, { useContext } from "react";
import { Random } from "meteor/random";
import { useTracker } from "meteor/react-meteor-data";

import { AppInstallationEntity } from "../entities/profile";
import { CommandEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";
import { LauncherIcon } from "./LauncherIcon";
import { WindowFrame } from "./widgets/WindowFrame";

export const LauncherWindow = () => {
  const runtime = useContext(RuntimeContext);
  // const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', 'main')
  // if (!shell) throw new Error(`no shell`);

  // const apis = useTracker(() => runtime.getNamespacesServingApi({
  //   apiVersion: 'profile.dist.app/v1alpha1',
  //   kind: 'AppInstallation',
  //   op: 'Read',
  // }));

  // const installs = useTracker(() => Array
  //   .from(apis.values())
  //   .flatMap(x => x
  //     .listEntities<AppInstallationEntity>('manifest.dist.app/v1alpha1', 'Activity'))) ?? [];
  const installations = useTracker(() => runtime.listEntities<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', 'profile'), []);

  // const activities = useTracker(() => Array
  //   .from(apis.values())
  //   .flatMap(x => x
  //     .listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity'))) ?? [];

  // const apps = useTracker(() => Array
  //   .from(apis.values())
  //   .flatMap(x => x
  //     .listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application'))) ?? [];

  // const listItems = activities
  //   .filter(x => x.spec.intentFilters?.some(x => x.action == 'app.dist.Main' && x.category == 'app.dist.Launcher'))
  //   .map(x => ({
  //     activity: x,
  //     app: x.metadata.ownerReferences
  //       ?.filter(y => y.kind == 'Application')
  //       .map(y => apps.find(z => z.metadata.namespace == x.metadata.namespace && z.metadata.name == y.name))[0],
  //   }));

    // icon maybe 𓃑 or ☰

  const launchApp = (appInstall: AppInstallationEntity) => {
    runtime.insertEntity<CommandEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Command',
      metadata: {
        name: Random.id(),
        namespace: 'session',
      },
      spec: {
        type: 'launch-intent',
        intent: {
          receiverRef: `entity://${appInstall.metadata.namespace}/profile.dist.app@v1alpha1/AppInstallation/${appInstall.metadata.name}`,
          action: 'app.dist.Main',
          category: 'app.dist.Launcher',
          // TODO: seems like there needs to be a better way to refer to a particular foreign application.
          // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
        }
      },
    })
    // throw new Error(`TODO: launch app ${appInstall.metadata.name}`);
  };

  return (
    <WindowFrame
        floatingRect={{left: 150, top: 0}}
        layoutMode="floating"
        resizable={false}
        onMoved={() => {}}
        onResized={() => {}}
        showLoader={false}
    >
      <section className="shell-powerbar">
        <div className="window-title">Launcher</div>
      </section>
      <nav className="activity-contents-wrap launcher-window">
        {installations.map(installation => (
          <LauncherIcon key={installation._id ?? `${installation.metadata.namespace}/${installation.metadata.name}`} appUri={installation.spec.appUri} onLaunch={() => launchApp(installation)} />
        ))}
      </nav>
    </WindowFrame>
  );
}
