import { useTracker } from "meteor/react-meteor-data";
import React, { useContext, useState } from "react";
import { ActivityEmbed } from "./ActivityEmbed";
import { WindowFrame } from "./widgets/WindowFrame";
import { RuntimeContext } from "./context";
import { TaskEntity } from "../entities/runtime";
import { ActivityEntity } from "../entities/manifest";

export const TaskWindow = (props: {
  task: TaskEntity,
  zIndex?: number;
  // sessionCatalog: SessionCatalog,
}) => {

  const runtime = useContext(RuntimeContext);

  // const task = runtime.getTask()

  const activity = useTracker(() => runtime?.manifestCatalog.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', props.task.spec.stack[0].activity.namespace, props.task.spec.stack[0].activity.name)) ?? null;

  const [lifeCycle, setLifecycle] = useState<'loading' | 'connecting' | 'ready' | 'finished'>('loading');

  function bringToTop() {
    runtime?.runTaskCommand(props.task, activity, {
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
        zIndex={props.zIndex}
        showLoader={lifeCycle !== 'ready'}
        onInteraction={() => bringToTop()}
        onResized={newSize => {
          const { placement } = props.task.spec;
          if (placement.current !== 'floating') return;
          runtime?.runTaskCommand(props.task, activity, {
            type: 'resize-window',
            taskName: props.task.metadata.name,
            xAxis: newSize.width,
            yAxis: newSize.height,
          });
        }}
        onMoved={newPos => {
          const { placement } = props.task.spec;
          if (placement.current !== 'floating') return;
          runtime?.runTaskCommand(props.task, activity, {
            type: 'move-window',
            taskName: props.task.metadata.name,
            xAxis: newPos.left,
            yAxis: newPos.top,
          });
        }}
      >
      {activity ? (
        <ActivityEmbed key={activity._id} className="activity-contents-wrap" task={props.task} activity={activity} onLifecycle={setLifecycle} />
      ) : []}
    </WindowFrame>
  );
}
