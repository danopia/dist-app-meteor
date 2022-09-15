import React, { Fragment, useContext } from "react";
import { Random } from "meteor/random";
import { useTracker } from "meteor/react-meteor-data";

import { AppInstallationEntity } from "../entities/profile";
import { CommandEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";
import { LauncherIcon } from "./LauncherIcon";
import { WindowFrame } from "./widgets/WindowFrame";

export const LauncherWindow = () => {
  const runtime = useContext(RuntimeContext);

  const namespaces = useTracker(() => Array.from(runtime.getNamespacesServingApi({
    apiVersion: 'profile.dist.app/v1alpha1',
    kind: 'AppInstallation',
    op: 'Read',
  }).keys()));

  // icon maybe 𓃑 or ☰

  return (
    <WindowFrame
        floatingRect={{left: 0, top: 0}}
        layoutMode="floating"
        resizable={false}
        onMoved={() => {}}
        onResized={() => {}}
        showLoader={false}
    >
      <section className="shell-powerbar">
        <div className="window-title">Launcher</div>
      </section>
      <nav className="activity-contents-wrap">
        {namespaces.map(namespace => (
          <LauncherSection namespace={namespace} />
        ))}
      </nav>
    </WindowFrame>
  );
}


export const LauncherSection = (props: {
  namespace: string;
}) => {
  const runtime = useContext(RuntimeContext);

  const installations = useTracker(() => runtime.listEntities<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', props.namespace), []);

  const icons = installations
    .flatMap(x => x.spec.launcherIcons
      .map(y => ({installation: x, launcherIcon: y})));

  // icon maybe 𓃑 or ☰

  const launchApp = (icon: typeof icons[number]) => {
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
          receiverRef: `entity://${icon.installation.metadata.namespace}/profile.dist.app@v1alpha1/AppInstallation/${icon.installation.metadata.name}`,
          action: icon.launcherIcon.action,
          category: 'app.dist.Launcher',
          // TODO: seems like there needs to be a better way to refer to a particular foreign application.
          // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
        }
      },
    });
    // throw new Error(`TODO: launch app ${appInstall.metadata.name}`);
  };

  return (
    <Fragment>
      <h3 style={{textTransform: 'uppercase', margin: '0.2em 1em 0', fontSize: '1em', color: '#999', fontWeight: 'normal'}}>{props.namespace}</h3>
      <div className="launcher-window">
        {icons.map(icon => (
          <LauncherIcon key={icon.installation._id} appUri={icon.installation.spec.appUri} onLaunch={() => launchApp(icon)} />
        ))}
      </div>
    </Fragment>
  );
}
