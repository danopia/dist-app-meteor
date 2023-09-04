import React, { useContext } from 'react';
import { AppInstallationEntity } from '/imports/entities/profile';
import { EntityHandle } from '/imports/engine/EntityHandle';
import { useTracker } from 'meteor/react-meteor-data';
import { RuntimeContext } from '../contexts';
import { ActivityEntity } from '/imports/entities/manifest';
import { CommandEntity, FrameEntity, WorkspaceEntity } from '/imports/entities/runtime';
import { createTask, deleteFrame } from '/imports/runtime/workspace-actions';
import { LaunchIntentEntity } from '/imports/entities/protocol';
import { createTaskForIntent } from '../frames/IntentWindow';

export const ForAppInstallation = (props: {
  hWorkspace: EntityHandle<WorkspaceEntity>;
  hAppInstallation: EntityHandle<AppInstallationEntity>;
  intent: LaunchIntentEntity['spec'];
  command: CommandEntity;
  cmdFrame: FrameEntity;
}) => {

  const runtime = useContext(RuntimeContext);

  const entities = useTracker(() => {
    const installation = props.hAppInstallation.get();
    if (installation) {
      const appNamespace = runtime.useRemoteNamespace(installation.spec.appUri);
      const appActivities = runtime.listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', appNamespace);
      return {installation, appActivities};
    }
    return null;
  }, [props.hAppInstallation]);
  if (!entities?.installation) return (
    <div>Waiting for AppInstallation...</div>
  );

  // Look for exactly one matching Activity
  const activities = entities.appActivities.filter(x => x.spec.intentFilters?.some(y => y.action == props.intent.action && y.category == props.intent.category));
  if (activities.length > 1) return (
    <div>More than one activity matched</div>
  );
  if (activities.length < 1) return (
    <div>Waiting for Activity...</div>
  );
  const [activity] = activities;

  const taskId = createTaskForIntent(
    props.hWorkspace,
    runtime,
    props.hWorkspace.coords.name,
    props.hAppInstallation.coords.namespace, props.hAppInstallation.coords.name,
    activity,
    props.command.metadata.name+'-new2',
  );
  // console.log('Created task', taskId);

  // TODO: this cleanup shall be done by deleteFrame
  runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
  deleteFrame(props.hWorkspace, props.cmdFrame.metadata.name);

  return (<div className="activity-contents-wrap">Loading intent...</div>);
}
