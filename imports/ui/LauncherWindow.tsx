import { Mongo } from "meteor/mongo";
import { useFind } from "meteor/react-meteor-data";
import React, { useContext } from "react";
import { EntitiesCollection } from "../db/entities";
import { ActivityEntity } from "../entities/manifest";
import { RuntimeContext } from "./context";
import { WindowFrame } from "./widgets/WindowFrame";

export const LauncherWindow = () => {
  const activities = useFind(() => {
    return EntitiesCollection.find({
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Activity',
    }) as Mongo.Cursor<ActivityEntity>;
  });

  const runtime = useContext(RuntimeContext);

  function launchActivityTask(activity: ActivityEntity) {
    runtime?.createTask(activity);
  }

  return (
    <WindowFrame
        floatingRect={{left: 0, top: 0}}
        layoutMode="floating"
        resizable={true}
        onMoved={() => {}}
        onResized={() => {}}
        showLoader={false}
        title="Launcher"
    >
      <nav className="activity-contents-wrap launcher-window">
        <ul>{activities.map(activity => activity.spec
            .intentFilters?.some(x =>
              x.action == 'app.dist.Main' && x.category == 'app.dist.Launcher') ? (
          <li key={activity._id}>
            <button onClick={() => launchActivityTask(activity)}>
              {activity.metadata.title}
            </button>
          </li>
        ) : [])}</ul>
      </nav>
    </WindowFrame>
  );
}
