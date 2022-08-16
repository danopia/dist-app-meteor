import { useTracker } from "meteor/react-meteor-data";
import React, { useContext, useState } from "react";
import { ActivityEntity, TaskEntity } from "../api/entities";
import { EntitiesCollection } from "../db/entities";
import { ActivityEmbed } from "./ActivityEmbed";
import { WindowFrame } from "./widgets/WindowFrame";
import { RuntimeContext } from "./context";

export const TaskWindow = (props: {
  task: TaskEntity,
  // sessionCatalog: SessionCatalog,
}) => {

  const runtime = useContext(RuntimeContext);

  // const task = runtime.getTask()

  const activity = useTracker(() => {
    return EntitiesCollection.findOne({
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Activity',
      'metadata.catalogId': props.task.spec.stack[0].activity.catalogId,
      'metadata.namespace': props.task.spec.stack[0].activity.namespace,
      'metadata.name': props.task.spec.stack[0].activity.name,
    }) as ActivityEntity | null;
  });

  const [lifeCycle, setLifecycle] = useState<'loading' | 'connecting' | 'ready' | 'finished'>('loading');

  function bringToTop() {
    runtime?.runTaskCommand(props.task, {
      type: 'bring-to-top',
      taskName: props.task.metadata.name,
    });
  }

  return (
    <WindowFrame
        title={`Task ${props.task.metadata.name}`}
        floatingRect={props.task.spec.placement.floating}
        layoutMode={props.task.spec.placement.current}
        resizable={true}
        showLoader={lifeCycle !== 'ready'}
        onInteraction={() => bringToTop()}
        onResized={newSize => {
          const { placement } = props.task.spec;
          if (placement.current !== 'floating') return;
          runtime?.runTaskCommand(props.task, {
            type: 'resize-window',
            taskName: props.task.metadata.name,
            xAxis: newSize.width,
            yAxis: newSize.height,
          });
        }}
        onMoved={newPos => {
          const { placement } = props.task.spec;
          if (placement.current !== 'floating') return;
          runtime?.runTaskCommand(props.task, {
            type: 'move-window',
            taskName: props.task.metadata.name,
            xAxis: newPos.left,
            yAxis: newPos.top,
          });
        }}
      >
      {activity ? (
        <ActivityEmbed key={activity._id} className="activity-contents-wrap" activity={activity} onLifecycle={setLifecycle} />
      ) : []}
    </WindowFrame>
  );
}
