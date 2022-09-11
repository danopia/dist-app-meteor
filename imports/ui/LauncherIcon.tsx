import React, { useContext } from "react";
import { ApplicationEntity, ActivityEntity } from "../entities/manifest";
import { RuntimeContext } from "./contexts";

export const LauncherIcon = (props: {
  appUri: string;
  onLaunch: () => void;
}) => {
  const runtime = useContext(RuntimeContext);

  const appNamespace = runtime.useRemoteNamespace(props.appUri);
  if (!appNamespace) return (
    <div>loading...</div>
  );

  const [app] = runtime.listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application', appNamespace);
  const activities = runtime.listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', appNamespace);
  const [activity] = activities.filter(x => x.spec.intentFilters?.some(y => y.action == 'app.dist.Main' && y.category == 'app.dist.Launcher'));

  if (app.spec.icon?.type == 'glyph') return (
    <button onClick={props.onLaunch}>
      <div className="appIcon" style={{
          backgroundColor: app.spec.icon.glyph.backgroundColor,
          color: app.spec.icon.glyph.foregroundColor,
        }}>{app.spec.icon.glyph.text}</div>
      <span>{activity.metadata.title}</span>
    </button>
  );

  if (app.spec.icon?.type == 'svg') return (
    <button onClick={props.onLaunch}>
      <div className="appIcon" style={{
          backgroundImage: `url("data:image/svg+xml;base64,${btoa(app.spec.icon.svg.textData)}")`,
          backgroundColor: app.spec.icon.svg.backgroundColor,
          backgroundRepeat: "no-repeat",
          backgroundPosition: 'center',
          backgroundSize: '65%',
        }}></div>
      <span>{activity.metadata.title}</span>
    </button>
  );

  return (
    <button onClick={props.onLaunch}>
      {props.appUri}
    </button>
  );
}
