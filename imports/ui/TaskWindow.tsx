import { useTracker } from "meteor/react-meteor-data";
import React, { useContext, useState } from "react";
import { ActivityEmbed } from "./ActivityEmbed";
import { WindowFrame } from "./widgets/WindowFrame";
import { RuntimeContext } from "./contexts";
import { TaskEntity } from "../entities/runtime";
import { ActivityEntity } from "../entities/manifest";

export const TaskWindow = (props: {
  task: TaskEntity,
  zIndex?: number;
  // sessionCatalog: SessionCatalog,
}) => {

  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'default', 'main')
  if (!shell) throw new Error(`no shell`);

  // const task = runtime.getTask()

  const activity = useTracker(() => runtime.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', props.task.spec.stack[0].activity.namespace, props.task.spec.stack[0].activity.name)) ?? null;

  const [lifeCycle, setLifecycle] = useState<'loading' | 'connecting' | 'ready' | 'finished'>('loading');

  const bringToTop = () => {
    shell.runTaskCommand(props.task, activity, {
      type: 'bring-to-top',
      // taskName: props.task.metadata.name,
    });
  };

  return (
    <WindowFrame
        // title={`Task ${props.task.metadata.name}`}
        floatingRect={props.task.spec.placement.floating}
        sizeRules={activity?.spec.windowSizing}
        layoutMode={props.task.spec.placement.current}
        resizable={true}
        zIndex={props.zIndex}
        showLoader={lifeCycle !== 'ready'}
        isRolledUp={props.task.spec.placement.rolledWindow}
        onInteraction={() => bringToTop()}
        onResized={newSize => {
          const { placement } = props.task.spec;
          if (placement.current !== 'floating') return;
          shell.runTaskCommand(props.task, activity, {
            type: 'resize-window',
            xAxis: newSize.width,
            yAxis: placement.rolledWindow ? placement.floating.height : newSize.height,
          });
        }}
        onMoved={newPos => {
          const { placement } = props.task.spec;
          if (placement.current !== 'floating') return;
          shell.runTaskCommand(props.task, activity, {
            type: 'move-window',
            xAxis: newPos.left,
            yAxis: newPos.top,
          });
        }}
      >
      <button className="window-rollup-toggle"
          onClick={() => shell.runTaskCommand(props.task, activity, {
            type: 'set-task-rollup',
            state: 'toggle',
          })}>
      </button>
      <section className="shell-powerbar">
        <div className="window-title">Task {props.task.metadata.name}</div>
        <nav className="window-buttons">
          <button onClick={() => shell.runTaskCommand(props.task, activity, {
            type: 'delete-task',
          })}>
            <svg version="1.1" height="20" viewBox="0 0 512 512">
              <path d="M256.010 204.645l100.118-100.146 51.344 51.33-100.118 100.146-51.344-51.329z" />
              <path d="M155.827 407.483l-51.344-51.358 100.161-100.132 51.344 51.358-100.161 100.132z" />
              <path d="M407.498 356.112l-51.373 51.358-100.118-100.146 51.373-51.358 100.118 100.146z" />
              <path d="M104.502 155.857l51.337-51.351 100.153 100.125-51.337 51.351-100.153-100.125z" />
              <path d="M255.983 307.36l-51.351-51.365 51.365-51.351 51.351 51.365-51.365 51.351z" />
            </svg>
          </button>
        </nav>
      </section>
      {(activity && !props.task.spec.placement.rolledWindow) ? (
        <ActivityEmbed key={activity._id} className="activity-contents-wrap" task={props.task} activity={activity} onLifecycle={setLifecycle} />
      ) : []}
    </WindowFrame>
  );
}
