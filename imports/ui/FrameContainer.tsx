import { useTracker } from "meteor/react-meteor-data";
import React, { Fragment, ReactNode, useContext, useState } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { ActivityEntity, ApplicationEntity } from "../entities/manifest";
import { AppInstallationEntity } from "../entities/profile";
import { FrameEntity, ActivityTaskEntity, CommandEntity } from "../entities/runtime";
import { ErrorFallback } from "../lib/error-fallback";
import { RuntimeContext } from "./contexts";
import { ExplorerWindow } from "./frames/ExplorerWindow";
import { IntentWindow } from "./frames/IntentWindow";
import { LauncherWindow } from "./frames/LauncherWindow";
import { IframeHost } from "./IframeHost";
import { AppIcon } from "./widgets/AppIcon";
import { WindowFrame } from "./widgets/WindowFrame";
import { GridLoader } from "react-spinners";

export const FrameContainer = (props: {
  zIndex?: number;
  sessionNamespace: string;
  workspaceName: string;
  className?: string | null;
  frame: FrameEntity;
  frameMode: "windowing" | "tabbed";
  // sessionCatalog: SessionCatalog,
}) => {
  const frameEntity = props.frame;

  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName)
  if (!shell) throw new Error(`no shell ${props.workspaceName}`);

  // const frameEntity = useTracker(() => runtime.getEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', props.sessionNamespace, props.frameName));
  // if (!frameEntity) throw new Error(`No Frame entity`);

  const contentRaw = useTracker(() => {
    const ref = frameEntity.spec.contentRef;
    if (ref == 'internal://launcher') return {kind: 'Launcher' as const};
    if (ref == 'internal://explorer') return {kind: 'Explorer' as const};
    const [_, kind, name] = ref.split('/');
    if (kind !== 'ActivityTask' && kind !== 'Command') throw new Error(`TODO: other contentRefs (${frameEntity.spec.contentRef})`);
    return runtime.getEntity<ActivityTaskEntity|CommandEntity>('runtime.dist.app/v1alpha1', kind, props.sessionNamespace, name);
  });

  const [lifeCycle, setLifecycle] = useState<'loading' | 'connecting' | 'ready' | 'finished'>('loading');

  const classNames = props.className ? [props.className] : [];
  let content: ReactNode;
  let title: ReactNode = (<div className="window-title">Untitled Frame</div>);
  switch (contentRaw?.kind) {

    case 'Launcher': {
      title = (
        <div className="window-title">Launcher</div>
      );
      content = (
        <LauncherWindow onLifecycle={setLifecycle} workspaceName={props.workspaceName} />
      );
      break;
    }

    case 'Explorer': {
      title = (
        <div className="window-title">Explorer</div>
      );
      content = (
        <ExplorerWindow onLifecycle={setLifecycle} />
      );
      break;
    }

    case "Command": {
      classNames.push("intent-frame");
      // TODO: better titlebar for commands
      if (contentRaw.spec.type == 'launch-intent') {
        title = (
          <div className="window-title">
            Intent: {contentRaw.spec.intent.action}
          </div>
        );
      } else {
        title = (
          <div className="window-title">
            {contentRaw.spec.type} command [{contentRaw.metadata.name}]
          </div>
        );
      }
      content = (
        <IntentWindow frame={frameEntity} command={contentRaw} workspaceName={props.workspaceName} shell={shell} onLifecycle={setLifecycle} />
      );
      break;
    }

    case "ActivityTask": {
      const runtime = useContext(RuntimeContext);

      const {app, activity} = useTracker(() => {
        const appInstallation = runtime.getEntity<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', contentRaw.spec.installationNamespace, contentRaw.spec.installationName);
        if (!appInstallation) throw new Error(`TODO: no appInstallation`);
        const appNamespace = runtime.useRemoteNamespace(appInstallation.spec.appUri);

        return {
          app: runtime.listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application', appNamespace)[0],
          activity: runtime.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', appNamespace, contentRaw.spec.activityName) ?? null,
        };
      });

      if (!activity) {
        content = (
          <div style={{gridArea: 'activity'}}>
            Hmm, activity not found: {contentRaw.spec.activityName} in {contentRaw.spec.installationNamespace}/{contentRaw.spec.installationName}.
          </div>
        );

      } else {
        title = (
          <div className="window-title">
            <AppIcon className="appIcon" iconSpec={activity.spec.icon ?? app?.spec.icon ?? null}></AppIcon>
            <span className="app-name">{activity.metadata.title}</span>
          </div>
        )

        switch (activity.spec.implementation.type) {
          case 'iframe': content = (
            <IframeHost className="activity-contents-wrap" task={frameEntity} activityTask={contentRaw} activity={activity} workspaceName={props.workspaceName} onLifecycle={setLifecycle} />
          ); break;
          default: content = (
            <div style={{gridArea: 'activity'}}>
              TODO: other implementation types
            </div>
          ); break;
        }
      }
      break;
    }

    default: {
      content = (
        <div style={{gridArea: 'activity'}}>
          Hmm, nothing here.
        </div>
      );
    }
  }

  const titleSection = (
    <section className="shell-powerbar">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {title}
      </ErrorBoundary>
      <nav className="window-buttons">
        <button onClick={() => shell.runTaskCommand(frameEntity, null, {
          type: 'delete-task',
        })}>
          <svg version="1.1" height="20" viewBox="0 0 10 10">
            <path d="m3 2-1 0 0 1 2 2-2 2 0 1 1 0 2-2 2 2 1 0 0-1-2-2 2-2 0-1-1 0-2 2z"/>
          </svg>
        </button>
      </nav>
    </section>
  );
  const bodySection = (
    <ErrorBoundary FallbackComponent={(props: FallbackProps) => (
        <div className="activity-contents-wrap frame-loader">
          <ErrorFallback {...props} />
        </div>
      )}>
      {content}
    </ErrorBoundary>
  );

  if (props.frameMode == 'tabbed') {
    return (
      <div className={'shell-window '+classNames.join(' ')}>
        {titleSection}
        {bodySection}
        {(lifeCycle !== 'ready') ? (<Fragment>
          <div className="activity-contents-wrap" style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
          }} />
          <GridLoader className="activity-contents-wrap frame-loader" style={{
            alignSelf: 'center',
            justifySelf: 'center',
          }} />
        </Fragment>) : []}
      </div>
    );
  }

  // TODO: move WindowFrame invocation into ActivityShell?
  return (
    <WindowFrame
        // title={`Task ${frameEntity.metadata.name}`}
        className={classNames.join(' ')}
        floatingRect={frameEntity.spec.placement.floating}
        sizeRules={frameEntity.spec.sizeConstraint}
        layoutMode={frameEntity.spec.placement.current}
        resizable={true}
        zIndex={props.zIndex}
        showLoader={lifeCycle !== 'ready'}
        isRolledUp={frameEntity.spec.placement.rolledWindow}
        onInteraction={() => {
          shell.runTaskCommand(frameEntity, null, {
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
          runtime.mutateEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', frameEntity.metadata.namespace, frameEntity.metadata.name, x => {
            x.spec.placement.floating.width = newSize.width;
            if (!x.spec.placement.rolledWindow) {
              x.spec.placement.floating.height = newSize.height;
            }
          });
          // shell.runTaskCommand(frameEntity, null, {
          //   type: 'resize-window',
          //   xAxis: newSize.width,
          //   yAxis: placement.rolledWindow ? (placement.floating.height ?? 200) : newSize.height,
          // });
        }}
        onMoved={newPos => {
          const { placement } = frameEntity.spec;
          if (placement.current !== 'floating') return;
          shell.runTaskCommand(frameEntity, null, {
            type: 'move-window',
            xAxis: newPos.left,
            yAxis: newPos.top,
          });
        }}
      >
      <button className="window-rollup-toggle"
          onClick={() => shell.runTaskCommand(frameEntity, null, {
            type: 'set-task-rollup',
            state: 'toggle',
          })}>
      </button>
      {titleSection}
      {bodySection}
    </WindowFrame>
  );
}
