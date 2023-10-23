import React, { useContext } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { AppInstallationEntity } from '/imports/entities/profile';
import { RuntimeContext } from '../contexts';
import { ActivityEntity } from '/imports/entities/manifest';
import { ActivityTaskEntity, FrameEntity, WorkspaceEntity } from '/imports/entities/runtime';
import { IframeHost } from '../IframeHost';
import { EntityHandle } from '/imports/engine/EntityHandle';

export const ActivityTaskWindow = (props: {
  activityTask: ActivityTaskEntity;
  task: FrameEntity;
  hWorkspace: EntityHandle<WorkspaceEntity>;
  onLifecycle: (lifecycle: 'loading' | 'connecting' | 'ready' | 'finished') => void;
}) => {
  const runtime = useContext(RuntimeContext);

  const {activity} = useTracker(() => {
    const appInstallation = runtime.getEntity<AppInstallationEntity>(
      'profile.dist.app/v1alpha1', 'AppInstallation',
      props.activityTask.spec.installationNamespace, props.activityTask.spec.installationName);
    if (!appInstallation) return {}; // throw new Error(`TODO: no appInstallation`);
    const appNamespace = runtime.useRemoteNamespace(appInstallation.spec.appUri);

    return {
      activity: runtime.getEntity<ActivityEntity>(
        'manifest.dist.app/v1alpha1', 'Activity',
        appNamespace, props.activityTask.spec.activityName) ?? null,
    };
  });





  if (!activity) {
    return (
      <div style={{gridArea: 'activity'}}>
        Hmm, activity not found: {props.activityTask.spec.activityName} in {props.activityTask.spec.installationNamespace}/{props.activityTask.spec.installationName}.
      </div>
    );
  }

  switch (activity.spec.implementation.type) {
    case 'iframe':
      return (
        <IframeHost className="activity-contents-wrap" task={props.task} activityTask={props.activityTask} activity={activity} hWorkspace={props.hWorkspace} onLifecycle={props.onLifecycle} />
      );
    default:
      return (
        <div style={{gridArea: 'activity'}}>
          TODO: other implementation types
        </div>
      );
  }
}
