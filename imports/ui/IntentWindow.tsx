import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { useTracker } from "meteor/react-meteor-data";
import React, { ReactNode, useContext, useState } from "react";
import GoogleButton from 'react-google-button';
import "urlpattern-polyfill";
import { EntityEngine } from "../engine/EntityEngine";
import { EntityHandle } from "../engine/EntityHandle";

import { ActivityEntity } from "../entities/manifest";
import { AppInstallationEntity } from "../entities/profile";
import { ActivityInstanceEntity, CommandEntity, TaskEntity, WorkspaceEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";
import { WindowFrame } from "./widgets/WindowFrame";

export const IntentWindow = (props: {
  command: CommandEntity;
  workspaceName: string;
  // cmdName: string;
  // intent: LaunchIntentEntity['spec'],
}) => {
  const runtime = useContext(RuntimeContext);

  const [floatingRect, setFloatingRect] = useState<{
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  }>({left: 100, top: 100, width: 500});

  // const apis = useTracker(() => runtime.getNamespacesServingApi({
  //   apiVersion: 'manifest.dist.app/v1alpha1',
  //   kind: 'Activity',
  //   op: 'Read',
  // }));

  // const activities = useTracker(() => Array
  //   .from(apis.values())
  //   .flatMap(x => x
  //     .listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity'))) ?? [];

  let children: ReactNode;
  const user = useTracker(() => Meteor.user() ?? (Meteor.loggingIn() ? 'waiting' : false), []);

  if (props.command.spec.type != 'launch-intent') throw new Error(`TODO: other commands`);
  const { intent } = props.command.spec;
  // console.log('IntentWindow', intent, props.command);

  if (intent.action == 'app.dist.View' && intent.category == 'app.dist.Browsable' && intent.data && new URLPattern({protocol: 'https:'}).test(intent.data)) {
    children = (
      <nav className="activity-contents-wrap launcher-window">
        <h2>Open Web URL</h2>
        <a href={intent.data} target="_blank" onClick={() => {
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', props.command.metadata.namespace, props.command.metadata.name);
        }}>
          Open {intent.data}
        </a>
      </nav>
    );
  }

  //@ts-expect-error extras is untyped
  if (intent.action == 'settings.AddAccount' && intent.extras.AccountTypes?.includes('v1alpha1.platform.dist.app')) {
    const startLogin = (loginFunc: typeof Meteor.loginWithGoogle) => {
      loginFunc({}, (err) => {
        if (err) {
          alert(err.message ?? err);
        } else {
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', props.command.metadata.namespace, props.command.metadata.name);
          // navigate('/my/new-shell');
        }
      });
    };

    children = (
      <div className="activity-contents-wrap" style={{padding: '0 1em 2em'}}>
        <h2>Add Platform Account</h2>
        <p>By signing in, your data will be stored on <strong>{new URL(Meteor.absoluteUrl()).origin}</strong>. You will then be able to keep your sessions around for later.</p>
        <div style={{ textAlign: 'center' }}>
          <GoogleButton style={{ display:'inline-block' }} disabled={!!user}
            onClick={() => startLogin(Meteor.loginWithGoogle)} />
        </div>
      </div>
    );
  }

  if (!children && typeof intent.receiverRef == 'string') {
    const hCommand = new EntityHandle<CommandEntity>(runtime, {
      apiVersion: 'runtime.dist.app/v1alpha1',
      apiKind: 'Command',
      namespace: props.command.metadata.namespace ?? 'default',
      name: props.command.metadata.name,
    });

    let baseUrl = 'entity://';
    let appInstallation: AppInstallationEntity | null = null;

    const hActivityInstance = hCommand
      .followOwnerReference<ActivityInstanceEntity>('runtime.dist.app/v1alpha1', 'ActivityInstance');
    if (hActivityInstance) {
      appInstallation = runtime.getEntity<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', hActivityInstance.spec.installationNamespace, hActivityInstance.spec.installationName);
      if (appInstallation) {
        const appNamespace = runtime.useRemoteNamespace(appInstallation?.spec.appUri);
        baseUrl = `entity://${appNamespace}/manifest.dist.app@v1alpha1/`;
        // throw {stack: JSON.stringify({appInstallation, intent}, null, 2)};
      }
    }

    const receiverUrl = new URL(intent.receiverRef, baseUrl);
    // console.log({receiverUrl})
    const match = new URLPattern({
      protocol: 'entity:',
      pathname: "//:namespace/:api@:version/:kind/:name",
    }).exec(receiverUrl);
    if (match) {
      const {api, kind, name, namespace, version} = match.pathname.groups as Record<string,string>;

      if (api == 'manifest.dist.app' && version == 'v1alpha1' && kind == 'Activity' && appInstallation) {
        const activity = runtime.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', namespace, name);
        if (activity) {
          const workspace = runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName);
          if (!workspace) throw new Error(`no workspace`);

          const taskId = createTask(runtime, workspace.metadata.name, appInstallation.metadata.namespace, appInstallation.metadata.name, activity);
          console.log('Created task', taskId);
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);

          children = (<div className="activity-contents-wrap">Loading intent...</div>);
        }

      } else if (api == 'profile.dist.app' && version == 'v1alpha1' && kind == 'AppInstallation') {
        const installation = runtime.getEntity<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', namespace, name);
        if (installation) {
          const appNamespace = runtime.useRemoteNamespace(installation.spec.appUri);
          const appActivities = runtime.listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', appNamespace);
          const activities = appActivities.filter(x => x.spec.intentFilters?.some(y => y.action == intent.action && y.category == intent.category));
          if (activities.length > 1) return (<div>More than one activity matched</div>);
          if (activities.length < 1) return (<div>Less than one activity matched</div>);
          const [activity] = activities;

          const workspace = runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName);
          if (!workspace) throw new Error(`no workspace`);

          const taskId = createTask(runtime, workspace.metadata.name, installation.metadata.namespace, installation.metadata.name, activity);
          console.log('Created task', taskId);
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);

          children = (<div className="activity-contents-wrap">Loading intent...</div>);
        }
      }
    }
  }

  children ??= (
    <nav className="activity-contents-wrap launcher-window">
      <h2>TODO: unhandled intent</h2>
      <pre>{JSON.stringify({intent: intent, owner: props.command.metadata.ownerReferences}, null, 2)}</pre>
    </nav>
  );

  return (
    <WindowFrame
        floatingRect={floatingRect}
        className="intent-frame"
        layoutMode="floating"
        resizable={true}
        sizeRules={{maxWidth: 800}}
        onMoved={xy => setFloatingRect({ ...floatingRect, left: xy.left, top: xy.top })}
        onResized={xy => setFloatingRect({ ...floatingRect, width: xy.width, height: xy.height })}
        showLoader={user == 'waiting'}
        zIndex={50}
    >
      <section className="shell-powerbar">
        <div className="window-title">Handle Intent</div>
        <nav className="window-buttons">
          <button onClick={() => runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name)}>
            <svg version="1.1" height="20" viewBox="0 0 10 10">
              <path d="m3 2-1 1 2 2-2 2 1 1 2-2 2 2 1-1-2-2 2-2-1-1-2 2z"/>
            </svg>
          </button>
        </nav>
      </section>
      {children}
    </WindowFrame>
  );
}



function createTask(runtime: EntityEngine, workspaceName: string, installationNamespace: string | undefined, installationName: string, firstActivity: ActivityEntity) {
  const taskId = Random.id();
  const actInstId = Random.id();

  runtime.insertEntity<ActivityInstanceEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'ActivityInstance',
    metadata: {
      name: actInstId,
      namespace: 'session',
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Task',
        name: taskId,
      }],
    },
    spec: {
      installationNamespace: installationNamespace ?? 'default',
      installationName,
      activityName: firstActivity.metadata.name,
      // activity: {
      //   catalogId: firstActivity.metadata.catalogId,
      //   namespace: firstActivity.metadata.namespace,
      //   name: firstActivity.metadata.name,
      // },
    },
  });

  runtime.insertEntity<TaskEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Task',
    metadata: {
      name: taskId,
      namespace: 'session',
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Workspace',
        name: workspaceName,
        // uid: this.workspaceEntity.metadata.uid,
      }],
    },
    spec: {
      placement: {
        current: 'floating',
        rolledWindow: false,
        floating: {
          left: 100 + Math.floor(Math.random() * 200),
          top: 100 + Math.floor(Math.random() * 200),
          width: firstActivity.spec.windowSizing?.initialWidth ?? 400,
          height: firstActivity.spec.windowSizing?.initialHeight ?? 300,
        },
        grid: {
          area: 'fullscreen',
        },
      },
      stack: [{
        activityInstance: actInstId,
      }],
    },
  });

  runtime.mutateEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', workspaceName, spaceSNap => {spaceSNap.spec.windowOrder.unshift(taskId)});

  return taskId;
}
