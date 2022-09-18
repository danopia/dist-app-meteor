import { useTracker } from "meteor/react-meteor-data";
import React, { ReactNode, useContext, useState } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { FrameEntity, ActivityTaskEntity, CommandEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";
import { IntentWindow } from "./IntentWindow";
import { LauncherWindow } from "./LauncherWindow";
import { TaskWindow } from "./TaskWindow";
import { WindowFrame } from "./widgets/WindowFrame";

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Reset page</button>
  </div>
);

export const FrameWindow = (props: {
  zIndex?: number;
  sessionNamespace: string;
  workspaceName: string;
  frame: FrameEntity;
  // sessionCatalog: SessionCatalog,
}) => {
  const frameEntity = props.frame;

  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName)
  if (!shell) throw new Error(`no shell`);

  // const frameEntity = useTracker(() => runtime.getEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', props.sessionNamespace, props.frameName));
  // if (!frameEntity) throw new Error(`No Frame entity`);

  const contentRaw = useTracker(() => {
    const ref = frameEntity.spec.contentRef;
    if (ref == 'internal://launcher') return {kind: 'Launcher' as const};
    const [_, kind, name] = ref.split('/');
    if (kind !== 'ActivityTask' && kind !== 'Command') throw new Error(`TODO: other contentRefs (${frameEntity.spec.contentRef})`);
    return runtime.getEntity<ActivityTaskEntity|CommandEntity>('runtime.dist.app/v1alpha1', kind, props.sessionNamespace, name);
  });
  const contentEntity = (contentRaw?.kind == 'ActivityTask' ? contentRaw : null);

  const [lifeCycle, setLifecycle] = useState<'loading' | 'connecting' | 'ready' | 'finished'>('loading');

  let content: ReactNode;
  let title: ReactNode = (<div className="window-title">Untitled Frame</div>);
  switch (contentRaw?.kind) {
    case 'Launcher': {
      title = (
        <div className="window-title">Launcher</div>
      );
      content = (
        <LauncherWindow onLifecycle={setLifecycle} />
      );
      break;
    }
    case "Command": {
      title = (
        <div className="window-title">TODO: command titlebar. {contentRaw.kind} {contentRaw.metadata.name}</div>
      )
      content = (
        <IntentWindow frame={frameEntity} command={contentRaw} workspaceName={props.workspaceName} onLifecycle={setLifecycle} />
      );
      break;
    }
    case "ActivityTask": {
      title = (
        <div className="window-title">TODO: activity titlebar. {contentRaw.kind} {contentRaw.metadata.name}</div>
      )
      content = (
        <TaskWindow task={frameEntity} activityTask={contentRaw} workspaceName={props.workspaceName} onLifecycle={setLifecycle} />
      );
      break;
    }
    default: {
      content = (
        <div>Hmm, nothing here.</div>
      );
    }
  }

  // TODO: move WindowFrame invocation into ActivityShell?
  return (
    <WindowFrame
        // title={`Task ${frameEntity.metadata.name}`}
        floatingRect={frameEntity.spec.placement.floating}
        sizeRules={frameEntity.spec.sizeConstraint}
        layoutMode={frameEntity.spec.placement.current}
        resizable={true}
        zIndex={props.zIndex}
        showLoader={lifeCycle !== 'ready'}
        isRolledUp={frameEntity.spec.placement.rolledWindow}
        onInteraction={() => {
          shell.runTaskCommand(frameEntity, contentEntity, {
            type: 'bring-to-top',
          });
        }}
        onResized={newSize => {
          const { placement } = frameEntity.spec;
          if (placement.current !== 'floating') return;
          if (Math.floor(placement.floating.width ?? -1) == Math.floor(newSize.width) &&
              Math.floor(placement.floating.height ?? -1) == Math.floor(newSize.height)) {
            return;
          }
          shell.runTaskCommand(frameEntity, contentEntity, {
            type: 'resize-window',
            xAxis: newSize.width,
            yAxis: placement.rolledWindow ? (placement.floating.height ?? 200) : newSize.height,
          });
        }}
        onMoved={newPos => {
          const { placement } = frameEntity.spec;
          if (placement.current !== 'floating') return;
          shell.runTaskCommand(frameEntity, contentEntity, {
            type: 'move-window',
            xAxis: newPos.left,
            yAxis: newPos.top,
          });
        }}
      >
      <button className="window-rollup-toggle"
          onClick={() => shell.runTaskCommand(frameEntity, contentEntity, {
            type: 'set-task-rollup',
            state: 'toggle',
          })}>
      </button>
      <section className="shell-powerbar">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {title}
        </ErrorBoundary>
        <nav className="window-buttons">
          <button onClick={() => shell.runTaskCommand(frameEntity, contentEntity, {
            type: 'delete-task',
          })}>
            <svg version="1.1" height="20" viewBox="0 0 10 10">
              <path d="m3 2-1 1 2 2-2 2 1 1 2-2 2 2 1-1-2-2 2-2-1-1-2 2z"/>
            </svg>
          </button>
        </nav>
      </section>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {content}
      </ErrorBoundary>
    </WindowFrame>
  );
}
