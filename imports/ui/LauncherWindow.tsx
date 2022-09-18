import React, { Fragment, useContext, useEffect } from "react";
import { Random } from "meteor/random";
import { useTracker } from "meteor/react-meteor-data";

import { AppInstallationEntity } from "../entities/profile";
import { CommandEntity, FrameEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";
import { LauncherIcon } from "./LauncherIcon";

export const LauncherWindow = (props: {
  onLifecycle: (lifecycle: "loading" | "connecting" | "ready" | "finished") => void,
}) => {
  const runtime = useContext(RuntimeContext);

  const namespaces = useTracker(() => Array.from(runtime.getNamespacesServingApi({
    apiVersion: 'profile.dist.app/v1alpha1',
    kind: 'AppInstallation',
    op: 'Read',
  }).keys()));

  useEffect(() => {
    props.onLifecycle('ready');
  }, []);

  // icon maybe 𓃑 or ☰

  return (
      <nav className="activity-contents-wrap">
        {namespaces.map(namespace => (
          <LauncherSection key={namespace} namespace={namespace} />
        ))}
      </nav>
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
    const commandName = Random.id();
    runtime.insertEntity<CommandEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Command',
      metadata: {
        name: commandName,
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
    runtime.insertEntity<FrameEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Frame',
      metadata: {
        name: commandName,
        namespace: 'session',
      },
      spec: {
        contentRef: '../Command/'+commandName,
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
    // throw new Error(`TODO: launch app ${appInstall.metadata.name}`);
  };

  return (
    <Fragment>
      <h3 style={{textTransform: 'uppercase', margin: '0.2em 1em 0', fontSize: '1em', color: '#999', fontWeight: 'normal'}}>{props.namespace}</h3>
      <div className="launcher-window">
        {icons.map(icon => (
          <button key={icon.installation._id} onClick={() => launchApp(icon)}>
            <LauncherIcon appUri={icon.installation.spec.appUri} />
          </button>
        ))}
      </div>
    </Fragment>
  );
}
