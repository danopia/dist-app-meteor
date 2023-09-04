import React, { Fragment, useContext, useEffect } from "react";
import { useTracker } from "meteor/react-meteor-data";

import { RuntimeContext } from "/imports/ui/contexts";
import { LauncherIcon } from "/imports/ui/LauncherIcon";
import { AppInstallationEntity } from "/imports/entities/profile";
import { launchNewIntent } from '/imports/runtime/workspace-actions';
import { WorkspaceEntity } from "/imports/entities/runtime";

export const LauncherWindow = (props: {
  onLifecycle: (lifecycle: "loading" | "connecting" | "ready" | "finished") => void,
  workspaceName: string;
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
          <LauncherSection key={namespace} namespace={namespace} workspaceName={props.workspaceName} />
        ))}
      </nav>
  );
}


export const LauncherSection = (props: {
  namespace: string;
  workspaceName: string;
}) => {
  const runtime = useContext(RuntimeContext);

  const installations = useTracker(() => runtime.listEntities<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', props.namespace), []);

  const icons = installations
    .flatMap(x => x.spec.launcherIcons
      .map(y => ({installation: x, launcherIcon: y})));

  // icon maybe 𓃑 or ☰

  const launchApp = (icon: typeof icons[number]) => {

    const hWorkspace = runtime
      .getEntityHandle<WorkspaceEntity>(
        'runtime.dist.app/v1alpha1', 'Workspace',
        'session', props.workspaceName);

    launchNewIntent(hWorkspace, {
      receiverRef: `entity://${icon.installation.metadata.namespace}/profile.dist.app/v1alpha1/AppInstallation/${icon.installation.metadata.name}`,
      action: icon.launcherIcon.action,
      category: 'app.dist.Launcher',
      // TODO: seems like there needs to be a better way to refer to a particular foreign application.
      // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
    });
    // throw new Error(`TODO: launch app ${appInstall.metadata.name}`);
  };

  return (
    <Fragment>
      <h3 style={{textTransform: 'uppercase', margin: '0.2em 1em 0', fontSize: '1em', color: '#999', fontWeight: 'normal'}}>{props.namespace}</h3>
      <div className="launcher-window">
        {icons.map(icon => (
          <button key={icon.installation._id} className="launcher-button" onClick={() => launchApp(icon)}>
            <LauncherIcon appUri={icon.installation.spec.appUri} />
          </button>
        ))}
      </div>
    </Fragment>
  );
}
