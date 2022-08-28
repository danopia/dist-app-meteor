import { useTracker } from "meteor/react-meteor-data";
import React, { useContext } from "react";
import { ActivityEntity, ApplicationEntity } from "../entities/manifest";
import { RuntimeContext } from "./contexts";
import { WindowFrame } from "./widgets/WindowFrame";

export const LauncherWindow = () => {
  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'default', 'main')
  if (!shell) throw new Error(`no shell`);

  const apis = useTracker(() => runtime.getNamespacesServingApi({
    apiVersion: 'manifest.dist.app/v1alpha1',
    kind: 'Activity',
    op: 'Read',
  }));

  const activities = useTracker(() => Array
    .from(apis.values())
    .flatMap(x => x
      .listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity'))) ?? [];

  const apps = useTracker(() => Array
    .from(apis.values())
    .flatMap(x => x
      .listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application'))) ?? [];

  const listItems = activities
    .filter(x => x.spec.intentFilters?.some(x => x.action == 'app.dist.Main' && x.category == 'app.dist.Launcher'))
    .map(x => ({
      activity: x,
      app: x.metadata.ownerReferences
        ?.filter(y => y.kind == 'Application')
        .map(y => apps.find(z => z.metadata.namespace == x.metadata.namespace && z.metadata.name == y.name))[0],
    }));

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
        <nav className="activity-contents-wrap launcher-window">
        {listItems.map(({activity, app}) => app?.spec.icon?.type == 'glyph' ? (
          <button key={activity._id ?? `${activity.metadata.namespace}/${activity.metadata.name}`} onClick={() => shell.createTask(activity)}>
            <div className="appIcon" style={{
                backgroundColor: app.spec.icon.glyph.backgroundColor,
                color: app.spec.icon.glyph.foregroundColor,
              }}>{app.spec.icon.glyph.text}</div>
            <span>{activity.metadata.title}</span>
          </button>
        ) : (
          <button key={activity._id ?? `${activity.metadata.namespace}/${activity.metadata.name}`} onClick={() => shell.createTask(activity)}>
            {activity.metadata.title}
          </button>
        ))}
      </nav>
    </WindowFrame>
  );
}
