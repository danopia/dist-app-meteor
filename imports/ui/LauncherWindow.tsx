import { Mongo } from "meteor/mongo";
import { Random } from "meteor/random";
import { useFind } from "meteor/react-meteor-data";
import React from "react";
import { ActivityEntity } from "../api/entities";
import { EntitiesCollection } from "../db/entities";
import { SessionCatalog } from "../runtime/SessionCatalog";
import { WindowFrame } from "./widgets/WindowFrame";

export const LauncherWindow = (props: {
  sessionCatalog: SessionCatalog,
}) => {
  const activities = useFind(() => {
    return EntitiesCollection.find({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Activity',
    }) as Mongo.Cursor<ActivityEntity>;
  });

  function launchActivityTask(activity: ActivityEntity) {
    props.sessionCatalog.insertEntity({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Task',
      metadata: {
        name: Random.id(),
      },
      spec: {
        placement: {
          type: 'floating',
          left: 100 + Math.floor(Math.random() * 200),
          top: 100 + Math.floor(Math.random() * 200),
          width: activity.spec.windowSizing?.initialWidth ?? 400,
          height: activity.spec.windowSizing?.initialHeight ?? 300,
        },
        stack: [{
          activity: {
            catalogId: activity.metadata.catalogId,
            namespace: activity.metadata.namespace,
            name: activity.metadata.name,
          },
        }],
      },
    })
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
