import React, { useContext } from 'react';
import { AppIcon } from '../widgets/AppIcon';
import { useTracker } from 'meteor/react-meteor-data';
import { AppInstallationEntity } from '/imports/entities/profile';
import { RuntimeContext } from '../contexts';
import { ActivityEntity, ApplicationEntity } from '/imports/entities/manifest';
import { ActivityTaskEntity } from '/imports/entities/runtime';

export const ActivityTaskTitle = (props: {
  activityTask: ActivityTaskEntity;
}) => {
  const runtime = useContext(RuntimeContext);

  const {app, activity} = useTracker(() => {
    const appInstallation = runtime.getEntity<AppInstallationEntity>(
      'profile.dist.app/v1alpha1', 'AppInstallation',
      props.activityTask.spec.installationNamespace, props.activityTask.spec.installationName);
    if (!appInstallation) return {}; // throw new Error(`TODO: no appInstallation`);
    const appNamespace = runtime.useRemoteNamespace(appInstallation.spec.appUri);

    return {
      app: runtime.listEntities<ApplicationEntity>(
        'manifest.dist.app/v1alpha1', 'Application',
        appNamespace)[0],
      activity: runtime.getEntity<ActivityEntity>(
        'manifest.dist.app/v1alpha1', 'Activity',
        appNamespace, props.activityTask.spec.activityName) ?? null,
    };
  });

  if (activity) {
    return (
      <div className="window-title">
        <AppIcon iconSpec={activity.spec.icon ?? app?.spec.icon ?? null}></AppIcon>
        <span className="app-name">{activity.metadata.title}</span>
      </div>
    )
  };

  return (
    <div className="window-title">
      <span className="app-name">TODO: loading app entities...</span>
    </div>
  );
}
