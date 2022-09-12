import { useTracker } from "meteor/react-meteor-data";
import React, { useContext, useState } from "react";
import { ActivityEmbed } from "./ActivityEmbed";
import { WindowFrame } from "./widgets/WindowFrame";
import { RuntimeContext } from "./contexts";
import { ActivityInstanceEntity, TaskEntity, WorkspaceEntity } from "../entities/runtime";
import { ActivityEntity } from "../entities/manifest";
import { AppInstallationEntity } from "../entities/profile";

export const TaskWindow = (props: {
  task: TaskEntity,
  zIndex?: number;
  workspaceName: string;
  // sessionCatalog: SessionCatalog,
}) => {

  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName)
  if (!shell) throw new Error(`no shell`);

  // const task = runtime.getTask()

  // TODO: how does one navigate the stack?
  const [actInst] = useTracker(() => props.task.spec.stack.map(x => runtime.getEntity<ActivityInstanceEntity>('runtime.dist.app/v1alpha1', 'ActivityInstance', props.task.metadata.namespace, x.activityInstance)).flatMap(x => x ? [x] : []));

  const appInstallation = useTracker(() => runtime.getEntity<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', 'profile', actInst.spec.installationName));
  if (!appInstallation) throw new Error(`TODO: no appInstallation`);

  const appNamespace = runtime.useRemoteNamespace(appInstallation.spec.appUri);

  const activity = useTracker(() => runtime.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', appNamespace, actInst.spec.activityName)) ?? null;

  const [lifeCycle, setLifecycle] = useState<'loading' | 'connecting' | 'ready' | 'finished'>('loading');

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
        onInteraction={() => {
          shell.runTaskCommand(props.task, actInst, {
            type: 'bring-to-top',
          });
        }}
        onResized={newSize => {
          const { placement } = props.task.spec;
          if (placement.current !== 'floating') return;
          if (Math.floor(placement.floating.width) == Math.floor(newSize.width) &&
              Math.floor(placement.floating.height) == Math.floor(newSize.height)) {
            return;
          }
          shell.runTaskCommand(props.task, actInst, {
            type: 'resize-window',
            xAxis: newSize.width,
            yAxis: placement.rolledWindow ? placement.floating.height : newSize.height,
          });
        }}
        onMoved={newPos => {
          const { placement } = props.task.spec;
          if (placement.current !== 'floating') return;
          shell.runTaskCommand(props.task, actInst, {
            type: 'move-window',
            xAxis: newPos.left,
            yAxis: newPos.top,
          });
        }}
      >
      <button className="window-rollup-toggle"
          onClick={() => shell.runTaskCommand(props.task, actInst, {
            type: 'set-task-rollup',
            state: 'toggle',
          })}>
      </button>
      <section className="shell-powerbar">
        <div className="window-title">{activity?.metadata.title || activity?.metadata.name}</div>
        <nav className="window-buttons">
          <button onClick={() => shell.runTaskCommand(props.task, actInst, {
            type: 'delete-task',
          })}>
            <svg version="1.1" height="20" viewBox="0 0 512 512">
              <path transform="scale(25.6)" d="m6.0879 4.082-2.0059 2.0059 3.9121 3.9121-3.9121 3.9102 2.0059 2.0078 3.9121-3.9121 3.9102 3.9102 2.0078-2.0059-3.9102-3.9121 3.9082-3.9102-2.0039-2.0059-3.9121 3.9121-3.9121-3.9121z" strokeWidth=".039062"/>
            </svg>
          </button>
        </nav>
      </section>
      {(activity && !props.task.spec.placement.rolledWindow) ? (
        <ActivityEmbed key={activity._id} className="activity-contents-wrap" task={props.task} activityInstance={actInst} activity={activity} workspaceName={props.workspaceName} onLifecycle={setLifecycle} />
      ) : []}
    </WindowFrame>
  );
}
