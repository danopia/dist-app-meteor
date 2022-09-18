import { useTracker } from "meteor/react-meteor-data";
import React, { useContext } from "react";

import { ActivityEmbed } from "/imports/ui/ActivityEmbed";
import { RuntimeContext } from "/imports/ui/contexts";
import { ActivityEntity } from "/imports/entities/manifest";
import { AppInstallationEntity } from "/imports/entities/profile";
import { FrameEntity, ActivityTaskEntity } from "/imports/entities/runtime";

export const TaskWindow = (props: {
  task: FrameEntity,
  activityTask: ActivityTaskEntity,
  zIndex?: number;
  workspaceName: string;
  onLifecycle: (lifecycle: "loading" | "connecting" | "ready" | "finished") => void,
  // sessionCatalog: SessionCatalog,
}) => {

  const runtime = useContext(RuntimeContext);

  // const task = runtime.getTask()

  const appInstallation = useTracker(() => runtime.getEntity<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', props.activityTask.spec.installationNamespace, props.activityTask.spec.installationName));
  if (!appInstallation) throw new Error(`TODO: no appInstallation`);

  const appNamespace = runtime.useRemoteNamespace(appInstallation.spec.appUri);

  const activity = useTracker(() => runtime.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', appNamespace, props.activityTask.spec.activityName)) ?? null;
  if (!activity) throw new Error(`no activity`);

  switch (activity.spec.implementation.type) {
    case 'iframe': return (
      <ActivityEmbed className="activity-contents-wrap" task={props.task} activityTask={props.activityTask} activity={activity} workspaceName={props.workspaceName} onLifecycle={props.onLifecycle} />
    );
    default: return (
      <div>TODO: other implementation types</div>
    );
  }
}
