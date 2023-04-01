import { useTracker } from "meteor/react-meteor-data";
import React, { useContext } from "react";
import { ApplicationEntity, ActivityEntity } from "../entities/manifest";
import { RuntimeContext } from "./contexts";
import { AppIcon } from "./widgets/AppIcon";

export const LauncherIcon = (props: {
  appUri: string;
}) => {
  const runtime = useContext(RuntimeContext);

  const { app, activities, activity } = useTracker(() => {
    const appNamespace = runtime.useRemoteNamespace(props.appUri);
    if (!appNamespace) return {};

    const [app] = runtime.listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application', appNamespace);
    const activities = runtime.listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', appNamespace);
    const [activity] = activities.filter(x => x.spec.intentFilters?.some(y => y.action == 'app.dist.Main' && y.category == 'app.dist.Launcher'));
    return { app, activities, activity };
  });

  if (!app) return (
    <div className="appIcon">loading...</div>
  );

  if (!activity) return (<>
    <AppIcon className="appIcon" iconSpec={{type: 'glyph', glyph: {text: '?', backgroundColor: 'rgba(127, 127, 127, .5)'}}} />
    <span>Broken application</span>
  </>);

  return (
    <>
      <AppIcon className="appIcon" iconSpec={activity.spec.icon ?? app.spec.icon ?? null} />
      <span>{activity.metadata.title}</span>
    </>
  );
}
