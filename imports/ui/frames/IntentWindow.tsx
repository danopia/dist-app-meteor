import { context } from "@opentelemetry/api";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import React, { ReactNode, useContext, useEffect } from "react";
import GoogleButton from 'react-google-button';
import "urlpattern-polyfill";
import { AddWebAccountIntent } from "../intents/AddWebAccountIntent";
import { AuthorizeApiBindingIntent } from "../intents/AuthorizeApiBindingIntent";
import { AppIcon } from "../widgets/AppIcon";

import { EntityEngine } from "/imports/engine/EntityEngine";
import { ActivityEntity, ApplicationEntity } from "/imports/entities/manifest";
import { AppInstallationEntity } from "/imports/entities/profile";
import { ActivityTaskEntity, CommandEntity, FrameEntity, WorkspaceEntity } from "/imports/entities/runtime";
import { extractTraceAnnotations, LogicTracer } from "/imports/lib/tracing";
import { ShellSession } from "/imports/runtime/ShellSession";
import { AppListingEntity } from "/imports/runtime/system-apis/market";
import { marketUrl } from "/imports/settings";
import { RuntimeContext } from "/imports/ui/contexts";
import { bringToTop, deleteFrame } from "/imports/runtime/workspace-actions";

type IntentWindowProps = {
  frame: FrameEntity;
  command: CommandEntity;
  workspaceName: string;
  // cmdName: string;
  // intent: LaunchIntentEntity['spec'],
  shell?: ShellSession | null;
  onLifecycle: (lifecycle: "loading" | "connecting" | "ready" | "finished") => void,
};

const tracer = new LogicTracer({
  name: 'IntentWindow',
  requireParent: true,
})

export const IntentWindow = (props: IntentWindowProps) => {
  const ctx = extractTraceAnnotations(props.command?.metadata?.annotations ?? {});
  return context.with(ctx, () => tracer.syncSpan('<IntentWindow/>', {
    attributes: {
      'distapp.command.type': props.command.spec.type,
    },
  }, () => IntentWindowInner(props)));
};

const IntentWindowInner = (props: IntentWindowProps) => {
  const runtime = useContext(RuntimeContext);
  useEffect(() => props.onLifecycle('ready'), []);

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
    return (
      <nav className="activity-contents-wrap launcher-window">
        <h2>Open Web URL</h2>
        <a href={intent.data} target="_blank" onClick={() => {
          // TODO: this cleanup shall be done by deleteFrame
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
          const hWorkspace = runtime.getEntityHandle<WorkspaceEntity>(
            'runtime.dist.app/v1alpha1', 'Workspace',
            'session', props.workspaceName);
          deleteFrame(hWorkspace, props.frame.metadata.name);
        }}>
          Open {intent.data}
        </a>
      </nav>
    );
  }

  if (intent.action == 'app.dist.AuthorizeApiBinding' && intent.contextRef) {
    return (
      <AuthorizeApiBindingIntent runtime={runtime} command={props.command} cmdFrame={props.frame} shell={props.shell} />
    );
  }

  if (intent.action == 'app.dist.AddWebAccount' && intent.contextRef) {
    return (
      <AddWebAccountIntent runtime={runtime} command={props.command} cmdFrame={props.frame} shell={props.shell} />
    );
  }

  //@ts-expect-error extras is untyped
  if (intent.action == 'settings.AddAccount' && intent.extras.AccountTypes?.includes('v1alpha1.platform.dist.app')) {

    if (user) return (
      <div className="activity-contents-wrap" style={{padding: '0 1em 2em'}}>
        <h2>Add Platform Account</h2>
        <p>You are already logged in to <strong>{new URL(Meteor.absoluteUrl()).origin}</strong>!</p>
      </div>
    );

    const startLogin = (loginFunc: typeof Meteor.loginWithGoogle) => {
      loginFunc({}, (err) => {
        if (err) {
          alert(err.message ?? err);
        } else {
          // TODO: this cleanup shall be done by deleteFrame
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
          const hWorkspace = runtime.getEntityHandle<WorkspaceEntity>(
            'runtime.dist.app/v1alpha1', 'Workspace',
            'session', props.workspaceName);
          deleteFrame(hWorkspace, props.frame.metadata.name);

          // navigate('/my/new-shell');
        }
      });
    };

    return (
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

  if (!children && typeof intent.dataRef == 'string') {
    const match = new URLPattern({
      protocol: 'entity:',
      pathname: "//:namespace/:api/:version/:kind/:name",
    }).exec(intent.dataRef);
    if (match) {
      const {api, kind, name, namespace, version} = match.pathname.groups as Record<string,string>;
      // console.log({intent, api, kind, name, namespace, version});

      if (intent.action == 'app.dist.InstallApp' && namespace == 'bundled' && kind == 'Application') {
        // @ts-expect-error extras is not typed yet
        const targetNamespace = intent.extras?.['target-profile'] ?? 'profile:guest';
        console.log('Want to install', name, 'into', targetNamespace);

        if (runtime.getEntity<AppInstallationEntity>(
          'profile.dist.app/v1alpha1', 'AppInstallation',
          targetNamespace, `bundledinstall-${props.command.metadata.name}`
        )) {
          console.log('Nvm, already installed.');

        } else {
          runtime.insertEntity<AppInstallationEntity>({
            apiVersion: 'profile.dist.app/v1alpha1',
            kind: 'AppInstallation',
            metadata: {
              name: `bundledinstall-${props.command.metadata.name}`,
              namespace: targetNamespace,
            },
            spec: {
              appUri: `${encodeURIComponent(namespace)}:${name}`,
              // isInLauncher: true,
              launcherIcons: [{
                action: 'app.dist.Main',
              }],
              preferences: {},
            },
          });

          // TODO: this cleanup shall be done by deleteFrame
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
          const hWorkspace = runtime.getEntityHandle<WorkspaceEntity>(
            'runtime.dist.app/v1alpha1', 'Workspace',
            'session', props.workspaceName);
          deleteFrame(hWorkspace, props.frame.metadata.name);
        }

        return (<div className="activity-contents-wrap">Loading intent...</div>);
      }

      if (intent.action == 'app.dist.InstallApp' && kind == 'AppListing') {
        // @ts-expect-error extras is not typed yet
        const targetNamespace = intent.extras?.['target-profile'] ?? 'profile:guest';
        console.log('Want to install', name, 'into', targetNamespace);

        const appListing = runtime.getEntity<AppListingEntity>('market.dist.app/v1alpha1', 'AppListing', namespace, name);
        if (!appListing) {
          throw new Error(`no AppListing yet, try again`);
          return (<div className="activity-contents-wrap">No AppListing yet...</div>);
        }
        // console.log({appListing})

        const appDataUrl = `ddp-catalog://${marketUrl.split('/')[2]}/${encodeURIComponent(appListing.spec.developmentDistUrl!.split(':')[1])}`;
        const appNs = runtime.useRemoteNamespace(appDataUrl);

        const [app] = runtime.listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application', appNs);
        console.log({app})

        return (<div className="activity-contents-wrap" style={{display: 'flex', flexDirection: 'column', gap: '1em', margin: '1em', alignItems: 'center'}}>
          You are about to install:
          <AppIcon className="appIcon" sizeRatio={3} iconSpec={appListing.spec.icon ?? null}  />
          <h2 style={{margin: 0}}>{appListing.metadata.title}</h2>
          <p style={{margin: 0}}>from:</p>
          <h4 style={{margin: 0}}>https://{marketUrl.split('/')[2]}</h4>
          <p style={{margin: 0}}>This application will have access to:</p>
          <h4 style={{margin: 0}}>TODO</h4>
          <button onClick={() => {
            runtime.insertEntity<AppInstallationEntity>({
              apiVersion: 'profile.dist.app/v1alpha1',
              kind: 'AppInstallation',
              metadata: {
                name: `app-${appListing.metadata.name}`,
                namespace: targetNamespace,
              },
              spec: {
                appUri: appDataUrl,
                // isInLauncher: true,
                launcherIcons: [{
                  action: 'app.dist.Main',
                }],
                preferences: {},
              },
            });

            // TODO: this cleanup shall be done by deleteFrame
            runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
            const hWorkspace = runtime.getEntityHandle<WorkspaceEntity>(
              'runtime.dist.app/v1alpha1', 'Workspace',
              'session', props.workspaceName);
            deleteFrame(hWorkspace, props.frame.metadata.name);

          }}>Install development version</button>
        </div>);

        return (<div className="activity-contents-wrap">Loading intent...</div>);
      }

    }
  }

  if (intent.receiverRef?.startsWith('internal://')) {
    const frameName = props.command.metadata.name+'-333';
    (async () => {
      runtime.insertEntity<FrameEntity>({
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Frame',
        metadata: {
          name: frameName,
          title: `${intent.receiverRef?.split('://')[1]}`,
          namespace: 'session',
          ownerReferences: [{
            apiVersion: 'runtime.dist.app/v1alpha1',
            kind: 'Workspace',
            name: props.workspaceName,
          }],
        },
        spec: {
          contentRef: intent.receiverRef!,
          placement: {
            current: 'floating',
            floating: {
              left: 15,
              top: 15,
              width: 500,
              height: 300,
            },
            grid: {
              area: 'fullscreen',
            },
            rolledWindow: false,
          },
        },
      });

      const hWorkspace = runtime.getEntityHandle<WorkspaceEntity>(
        'runtime.dist.app/v1alpha1', 'Workspace',
        'session', props.workspaceName);
      bringToTop(hWorkspace, frameName);

      // TODO: this cleanup shall be done by deleteFrame
      runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
      deleteFrame(hWorkspace, props.frame.metadata.name);
    })();
    return;
  }

  if (!children && typeof intent.receiverRef == 'string') {
    const hCommand = runtime.getEntityHandle<CommandEntity>(
      'runtime.dist.app/v1alpha1', 'Command',
      props.command.metadata.namespace ?? 'default',
      props.command.metadata.name,
    );

    let baseUrl = 'entity://';
    let appInstallation: AppInstallationEntity | null = null;

    if (typeof intent.contextRef == 'string') {
      const match = new URLPattern({
        protocol: 'entity:',
        pathname: "//:namespace/:api/:version/:kind/:name",
      }).exec(intent.contextRef);
      if (match) {
        const {api, kind, name, namespace, version} = match.pathname.groups as Record<string,string>;
        if (api == 'profile.dist.app' && kind == 'AppInstallation') {
          appInstallation = runtime.getEntity<AppInstallationEntity>(
            'profile.dist.app/v1alpha1', 'AppInstallation',
            namespace, name);
          // appInstallation =
        }
      }
    }

    const hActivityTask = hCommand
      .followOwnerReference<ActivityTaskEntity>('runtime.dist.app/v1alpha1', 'ActivityTask');
    if (hActivityTask) {
      appInstallation = runtime.getEntity<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', hActivityTask.spec.installationNamespace, hActivityTask.spec.installationName);
      if (appInstallation) {
        const appNamespace = runtime.useRemoteNamespace(appInstallation?.spec.appUri);
        baseUrl = `entity://${appNamespace}/manifest.dist.app/v1alpha1/`;
        // throw {stack: JSON.stringify({appInstallation, intent}, null, 2)};
      }
    }

    const receiverUrl = new URL(intent.receiverRef, baseUrl);
    // console.log({receiverUrl})
    const match = new URLPattern({
      protocol: 'entity:',
      pathname: "//:namespace/:api/:version/:kind/:name",
    }).exec(receiverUrl);
    if (match) {
      const {api, kind, name, namespace, version} = match.pathname.groups as Record<string,string>;

      if (api == 'manifest.dist.app' && version == 'v1alpha1' && kind == 'Activity' && appInstallation) {
        const activity = runtime.getEntity<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity', namespace, name);
        if (activity) {
          const workspace = runtime.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName);
          if (!workspace) throw new Error(`no workspace`);

          const taskId = createTask(runtime, workspace.metadata.name, appInstallation.metadata.namespace, appInstallation.metadata.name, activity, props.command.metadata.name+'-new2');
          // console.log('Created task', taskId);

          // TODO: this cleanup shall be done by deleteFrame
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
          const hWorkspace = runtime.getEntityHandle<WorkspaceEntity>(
            'runtime.dist.app/v1alpha1', 'Workspace',
            'session', props.workspaceName);
          deleteFrame(hWorkspace, props.frame.metadata.name);

          return (<div className="activity-contents-wrap">Loading intent...</div>);
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

          const taskId = createTask(runtime, workspace.metadata.name, installation.metadata.namespace, installation.metadata.name, activity, props.command.metadata.name+'-new2');
          // console.log('Created task', taskId);

          // TODO: this cleanup shall be done by deleteFrame
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
          const hWorkspace = runtime.getEntityHandle<WorkspaceEntity>(
            'runtime.dist.app/v1alpha1', 'Workspace',
            'session', props.workspaceName);
          deleteFrame(hWorkspace, props.frame.metadata.name);

          return (<div className="activity-contents-wrap">Loading intent...</div>);
        }
      }
    }
  }

  return (
    <nav className="activity-contents-wrap launcher-window">
      <h2>TODO: unhandled intent</h2>
      <pre style={{overflowX: 'auto'}}>
        {JSON.stringify({intent: intent, owner: props.command.metadata.ownerReferences}, null, 2)}
      </pre>
    </nav>
  );
}



function createTask(runtime: EntityEngine, workspaceName: string, installationNamespace: string | undefined, installationName: string, firstActivity: ActivityEntity, taskName: string) {
  const taskId = taskName; // Random.id();
  const actInstId = taskName; // Random.id();

  if (runtime.getEntity<ActivityTaskEntity>("runtime.dist.app/v1alpha1", 'ActivityTask', 'session', actInstId)) {
    console.log(`BUG: double createTask`, actInstId);
    return actInstId;
  }

  runtime.insertEntity<ActivityTaskEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'ActivityTask',
    metadata: {
      name: actInstId,
      namespace: 'session',
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Frame',
        name: taskId,
      }],
    },
    spec: {
      installationNamespace: installationNamespace ?? 'default',
      installationName,
      activityName: firstActivity.metadata.name,
    },
    state: {
      appData: {},
    },
  });

  runtime.insertEntity<FrameEntity>({
    apiVersion: 'runtime.dist.app/v1alpha1',
    kind: 'Frame',
    metadata: {
      name: taskId,
      namespace: 'session',
      ownerReferences: [{
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Workspace',
        name: workspaceName,
        // uid: this.workspaceEntity.metadata.uid,
      }],
      title: firstActivity.metadata.title,
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
      contentRef: `../ActivityTask/${actInstId}`,
    },
  });

  const hWorkspace = runtime.getEntityHandle<WorkspaceEntity>(
    'runtime.dist.app/v1alpha1', 'Workspace',
    'session', workspaceName);
  bringToTop(hWorkspace, taskId);

  return taskId;
}
