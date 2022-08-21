import { useTracker } from "meteor/react-meteor-data";
import React, { useContext } from "react";
import { ActivityEntity } from "../entities/manifest";
import { RuntimeContext } from "./contexts";
import { WindowFrame } from "./widgets/WindowFrame";

export const LauncherWindow = () => {
  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'default', 'main')
  if (!shell) throw new Error(`no shell`);

  const activities = useTracker(() => {
    const apis = runtime.getNamespacesServingApi({
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Activity',
      op: 'Read',
    });
    return Array.from(apis.values())
      .flatMap(x => x.listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity'));
  }) ?? [];

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
        <ul>{activities.map(activity => activity.spec
            .intentFilters?.some(x =>
              x.action == 'app.dist.Main' && x.category == 'app.dist.Launcher') ? (
          <li key={activity._id}>
            <button onClick={() => shell.createTask(activity)}>
              {activity.metadata.title}
            </button>
          </li>
        ) : [])}</ul>
      </nav>
    </WindowFrame>
  );
}
