import { useTracker } from "meteor/react-meteor-data";
import React, { useState } from "react";
import { ActivityEntity, TaskEntity } from "../api/entities";
import { EntitiesCollection } from "../db/entities";
import { ActivityEmbed } from "./ActivityEmbed";
import { SessionCatalog } from "../runtime/SessionCatalog";
import { WindowFrame } from "./widgets/WindowFrame";

export const TaskWindow = (props: {
  task: TaskEntity,
  sessionCatalog: SessionCatalog,
}) => {

  const activity = useTracker(() => {
    return EntitiesCollection.findOne({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Activity',
      'metadata.catalogId': props.task.spec.stack[0].activity.catalogId,
      'metadata.namespace': props.task.spec.stack[0].activity.namespace,
      'metadata.name': props.task.spec.stack[0].activity.name,
    }) as ActivityEntity | null;
  });

  const [lifeCycle, setLifecycle] = useState<'loading' | 'connecting' | 'ready' | 'finished'>('loading');

  return (
    <WindowFrame
        title={`Task ${props.task.metadata.name}`}
        floatingRect={props.task.spec.placement.type == 'floating' ? props.task.spec.placement : {}}
        layoutMode={'floating'}
        resizable={true}
        showLoader={lifeCycle !== 'ready'}
        onResized={newSize => {
          const { placement } = props.task.spec;
          if (placement.type !== 'floating') return;
          console.log("Storing new window size", newSize, 'for', props.task._id);
          props.sessionCatalog.mutateEntity<TaskEntity>(props.task.apiVersion, props.task.kind, props.task.metadata.namespace, props.task.metadata.name, taskSnap => taskSnap.spec.placement = {...placement, width: newSize!.width, height: newSize!.height});
        }}
        onMoved={newPos => {
          const { placement } = props.task.spec;
          if (placement.type !== 'floating') return;
          console.log("Storing new window position", newPos, 'for', props.task._id);
          props.sessionCatalog.mutateEntity<TaskEntity>(props.task.apiVersion, props.task.kind, props.task.metadata.namespace, props.task.metadata.name, taskSnap => taskSnap.spec.placement = {...placement, left: newPos.left, top: newPos.top});
        }}
      >
      {activity ? (
        <ActivityEmbed key={activity._id} className="activity-contents-wrap" activity={activity} onLifecycle={setLifecycle} />
      ) : []}
    </WindowFrame>
  );
}
