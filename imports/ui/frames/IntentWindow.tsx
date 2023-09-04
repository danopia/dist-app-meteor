import { context } from "@opentelemetry/api";
import React, { useContext, useEffect } from "react";
import "urlpattern-polyfill";
import { AddWebAccountIntent } from "../intents/AddWebAccountIntent";
import { AuthorizeApiBindingIntent } from "../intents/AuthorizeApiBindingIntent";
import { AppIcon } from "../widgets/AppIcon";

import { EntityEngine } from "/imports/engine/EntityEngine";
import { ActivityEntity, ApplicationEntity } from "/imports/entities/manifest";
import { AppInstallationEntity } from "/imports/entities/profile";
import { ActivityTaskEntity, CommandEntity, FrameEntity, WorkspaceEntity } from "/imports/entities/runtime";
import { extractTraceAnnotations, LogicTracer } from "/imports/lib/tracing";
import { AppListingEntity } from "/imports/runtime/system-apis/market";
import { marketUrl } from "/imports/settings";
import { RuntimeContext } from "/imports/ui/contexts";
import { bringToTop, deleteFrame } from "/imports/runtime/workspace-actions";
import { EntityHandle } from "/imports/engine/EntityHandle";
import { AddPlatformAccountIntent } from "../intents/AddPlatformAccountIntent";
import { ForAppInstallation } from "../intents/ForAppInstallation";

type IntentWindowProps = {
  frame: FrameEntity;
  command: CommandEntity;
  workspaceName: string;
  // cmdName: string;
  // intent: LaunchIntentEntity['spec'],
  hWorkspace: EntityHandle<WorkspaceEntity>;
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
          deleteFrame(props.hWorkspace, props.frame.metadata.name);
        }}>
          Open {intent.data}
        </a>
      </nav>
    );
  }

  if (intent.action == 'app.dist.AuthorizeApiBinding' && intent.contextRef) {
    return (
      <AuthorizeApiBindingIntent runtime={runtime} command={props.command} cmdFrame={props.frame} hWorkspace={props.hWorkspace} />
    );
  }

  if (intent.action == 'app.dist.AddWebAccount' && intent.contextRef) {
    return (
      <AddWebAccountIntent runtime={runtime} command={props.command} cmdFrame={props.frame} hWorkspace={props.hWorkspace} />
    );
  }

  // @ts-expect-error extras is untyped
  if (intent.action == 'settings.AddAccount' && intent.extras?.AccountTypes?.includes('v1alpha1.platform.dist.app')) {
    return (
      <AddPlatformAccountIntent hWorkspace={props.hWorkspace} command={props.command} cmdFrame={props.frame} />
    );
  }

  if (typeof intent.dataRef == 'string') {
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
          deleteFrame(props.hWorkspace, props.frame.metadata.name);
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
            deleteFrame(props.hWorkspace, props.frame.metadata.name);

          }}>Install development version</button>
        </div>);

        return (<div className="activity-contents-wrap">Loading intent...</div>);
      }

    }
  }

  if (intent.receiverRef?.startsWith('internal://')) {

    if (runtime.getEntity<FrameEntity>("runtime.dist.app/v1alpha1", 'Frame', 'session', props.command.metadata.name+'-333')) {
      console.log(`double createTask`, props.command.metadata.name+'-333');
      // return actInstId;
      return (
        <div>TODO 234332</div>
      );
    }

    const frameName = props.command.metadata.name+'-333';
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

    bringToTop(props.hWorkspace, frameName);

    // TODO: this cleanup shall be done by deleteFrame
    runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
    deleteFrame(props.hWorkspace, props.frame.metadata.name);

    return (
      <div>TODO 43i5435</div>
    );
  }

  if (typeof intent.receiverRef == 'string') {
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

    if (baseUrl == 'entity://' && !intent.receiverRef.startsWith('entity://')) {
      return (
        <div>BUG: 234iogjs</div>
      );
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

          const taskId = createTaskForIntent(props.hWorkspace, runtime, workspace.metadata.name, appInstallation.metadata.namespace, appInstallation.metadata.name, activity, props.command.metadata.name+'-new2');
          // console.log('Created task', taskId);

          // TODO: this cleanup shall be done by deleteFrame
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
          deleteFrame(props.hWorkspace, props.frame.metadata.name);

          return (<div className="activity-contents-wrap">Loading intent...</div>);
        }

      } else if (api == 'profile.dist.app' && version == 'v1alpha1' && kind == 'AppInstallation') {
        const hAppInstallation = runtime.getEntityHandle<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', namespace, name);
        return (
          <ForAppInstallation
              hWorkspace={props.hWorkspace}
              hAppInstallation={hAppInstallation}
              command={props.command}
              cmdFrame={props.frame}
              intent={intent}
            />
        )
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


/** @deprecated roll into proper centralized function */
export function createTaskForIntent(hWorkspace: EntityHandle<WorkspaceEntity>, runtime: EntityEngine, workspaceName: string, installationNamespace: string | undefined, installationName: string, firstActivity: ActivityEntity, taskName: string) {
  const taskId = taskName; // Random.id();
  const actInstId = taskName; // Random.id();

  if (runtime.getEntity<ActivityTaskEntity>("runtime.dist.app/v1alpha1", 'ActivityTask', 'session', actInstId)) {
    console.log(`double createTask`, actInstId);
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

  bringToTop(hWorkspace, taskId);

  return taskId;
}
