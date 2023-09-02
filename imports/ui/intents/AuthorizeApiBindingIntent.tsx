import './access-request.css';

import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { OpenAPIV3 } from 'openapi-types';
import React, { useMemo, useState } from 'react';
import { parse } from 'yaml';
import { AppIcon } from '../widgets/AppIcon';
import { EntityEngine } from '/imports/engine/EntityEngine';
import { ApiBindingEntity, ApiEntity, ApplicationEntity, WebAccountTypeEntity } from '/imports/entities/manifest';
import { ApiCredentialEntity, AppInstallationEntity } from '/imports/entities/profile';
import { ActivityTaskEntity, CommandEntity, FrameEntity, WorkspaceEntity } from '/imports/entities/runtime';
import { ShellSession } from '/imports/runtime/ShellSession';
import { RadioButtonList } from './RadioButtonList';
import { deleteFrame } from '/imports/runtime/workspace-actions';

export const AuthorizeApiBindingIntent = (props: {
  runtime: EntityEngine,
  // apiBinding: ApiBindingEntity;
  command: CommandEntity;
  cmdFrame: FrameEntity;
  shell?: ShellSession | null;
}) => {
  if (props.command.spec.type !== 'launch-intent') throw new Error(`not a launch-intent command`);
  const intent = props.command.spec.intent;

  // console.log('cmd', props.command)
  const match = new URLPattern({
    protocol: 'entity:',
    pathname: "//:namespace/:api/:version/:kind/:name",
  }).exec(intent.contextRef);
  if (!match) throw new Error(`failed urlpattern on ${intent.contextRef}`);
  const {api, kind, name, namespace, version} = match.pathname.groups as Record<string,string>;
  // console.log({api, kind, name, namespace, version})
  if (api !== 'manifest.dist.app' || kind !== 'ApiBinding') throw new Error(`not an ApiBinding`);

  const entities = useTracker(() => {
    // console.warn('fetching entities for AuthorizeApiBinding');
    const apiBinding = props.runtime.getEntity<ApiBindingEntity>(
      'manifest.dist.app/v1alpha1', 'ApiBinding',
      namespace, name);
    if (!apiBinding) return {error: `no apiBinding`};

    const api = props.runtime.getEntity<ApiEntity>('manifest.dist.app/v1alpha1', 'Api', apiBinding.metadata.namespace, apiBinding.spec.apiName);
    if (!api) return {error: `no api`};

    const activityTaskRef = props.command.metadata.ownerReferences?.find(x => x.kind == 'ActivityTask');
    if (!activityTaskRef) return {error: `no activityTask ref`};
    const activityTask = props.runtime.getEntity<ActivityTaskEntity>('runtime.dist.app/v1alpha1', 'ActivityTask', props.command.metadata.namespace, activityTaskRef.name);
    if (!activityTask) return {error: `no activityTask`};

    const frameRef = props.command.metadata.ownerReferences?.find(x => x.kind == 'Frame');
    if (!frameRef) return {error: `no frame ref`};
    const frame = props.runtime.getEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', props.command.metadata.namespace, activityTaskRef.name);
    if (!frame) return {error: `no frame`};

    const appInstallation = props.runtime.getEntity<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', activityTask.spec.installationNamespace, activityTask.spec.installationName);
    if (!appInstallation) return {error: `no appInstallation`};

    const appNamespace = props.runtime.useRemoteNamespace(appInstallation.spec.appUri);
    const [app] = props.runtime.listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application', appNamespace);
    if (!app) return {error: `no app`};

    const accountTypes = api.spec.vendorDomain ? props.runtime.findAllEntities<WebAccountTypeEntity>(
      'manifest.dist.app/v1alpha1', 'WebAccountType').flatMap(x => x.entity.spec.vendorDomain == api.spec.vendorDomain ? [x.entity] : []) : [];

    const apiCredentials = api.spec.vendorDomain ? props.runtime.findAllEntities<ApiCredentialEntity>(
      'profile.dist.app/v1alpha1', 'ApiCredential').flatMap(x => x.entity.spec.accountTypeId == api.spec.vendorDomain ? [x.entity] : []) : [];

    return {
      command: props.command,
      apiBinding,
      api,
      activityTask,
      frame,
      appInstallation,
      accountTypes,
      app,
      apiCredentials,
    };
  }, [props.runtime, props.command, name, namespace]);
  // console.log('authapibinding', {entities});

  const apiSpec = useMemo(() => {
    if (!entities.api) return null;
    if (entities.api && entities.api.spec.type !== 'openapi') throw new Error(
      `TODO: non-openapi Api entity: ${JSON.stringify(entities.api.spec.type)}`);
    return parse(entities.api.spec.definition) as OpenAPIV3.Document;
  }, [entities.api]);

  // const [serverUrl, setServerUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  // const [deviceRef, setDeviceRef] = useState('');
  // const [credentialRef, setCredentialRef] = useState('');

  if (!entities.api) {
    return (
      <div>waiting: {entities.error}</div>
    );
  }
  return (
    <form className="activity-contents-wrap" style={{display: 'flex', flexDirection: 'column', gap: '1em', padding: '1em', alignItems: 'center'}} onSubmit={evt => {
      evt.preventDefault();
      const target = evt.currentTarget as {
        serverUrl?: RadioNodeList;
        deviceName?: RadioNodeList;
        credentialName?: RadioNodeList;
      };
      if (entities.apiBinding.spec.auth?.required && !target.credentialName?.value) {
        alert('This application is requesting authenticated access. Please log in to the API before approving API access.');
        return;
      }

      (async () => {
        const capId = crypto.randomUUID().split('-')[0];
        console.log('Issuing cap.', {
          capId,
          apiBinding: entities.apiBinding,
          serverUrl: target.serverUrl?.value,
          deviceName: target.deviceName?.value,
          credentialName: target.credentialName?.value,
        });

        await props.runtime.mutateEntity<ActivityTaskEntity>(
          'runtime.dist.app/v1alpha1', 'ActivityTask',
          entities.activityTask.metadata.namespace, entities.activityTask.metadata.name,
          ent => {
            ent.state.caps ??= {};
            if (capId in ent.state.caps) throw new Error(`cap ${capId} already taken??`);
            // TODO: separate Capability kind?
            ent.state.caps[capId] = {
              type: 'HttpClient',
              apiBindingRef: `${entities.apiBinding.metadata.namespace}/${entities.apiBinding.metadata.name}`,
              apiCredentialRef: target.credentialName?.value,
              baseUrl: target.serverUrl?.value,
            };
          });

        await props.runtime.mutateEntity<CommandEntity>(
          'runtime.dist.app/v1alpha1', 'Command',
          props.command.metadata.namespace, props.command.metadata.name,
          x => {
            x.status = {
              outcome: 'Completed',
              resultRef: `cap:${capId}`,
            };
          });
        if (props.shell?.workspaceHandle) {
          deleteFrame(props.shell?.workspaceHandle, props.cmdFrame.metadata.name);
        }
      })();
    }}>
      <h2 style={{margin: 0}}>Internet Access Request</h2>
      <p style={{margin: 0}}>This application requests access to an Internet API.</p>
      <table className="access-request-table">
        <tbody>
          <tr style={{height: '2em'}}>
            <th>Application:</th>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                <AppIcon className="appIcon" iconSpec={entities.app.spec.icon ?? null}  />
                <h4 style={{margin: 0}}>{entities.app.metadata.title}</h4>
              </div>
            </td>
          </tr>
          <tr>
            <th>Will access URL:</th>
            <td style={{padding: '0.5em 0'}}>
              <RadioButtonList
                name="serverUrl"
                required
                options={[
                  ...apiSpec?.servers?.map(x => ({
                    id: x.url,
                    label: x.url,
                    message: x.description,
                  })) ?? [],
                  ...customUrl ? [{
                    id: customUrl,
                    label: customUrl,
                  }] : [],
                ]}
                newOption={{
                  label: 'Custom URL...',
                  onActivate: () => {
                    setCustomUrl(new URL(prompt('Custom URL:', customUrl) ?? '').toString());
                  },
                }}
              />
            </td>
          </tr>
          <tr>
            <th>From device:</th>
            <td style={{padding: '0.5em 0'}}>
              <RadioButtonList
                name="deviceName"
                required
                options={[
                  {
                    id: 'browser',
                    label: `Browser (${navigator.userAgentData.brands[0].brand})`,
                    ...(entities.api.spec.crossOriginResourceSharing !== 'open' ? {
                      disabled: true,
                      message: 'URL disallows cross-origin requests',
                    } : {}),
                  },
                  {
                    id: 'server',
                    label: `Server (${new URL(Meteor.absoluteUrl()).origin})`,
                  },
                ]}
              />
            </td>
          </tr>
          <tr>
            <th>With your account:</th>
            <td style={{padding: '0.5em 0'}}>
              {entities.apiBinding.spec.auth?.required ? (<>
                <RadioButtonList
                  name="credentialName"
                  required
                  options={entities.apiCredentials.map(x => ({
                    id: `${x.metadata.namespace}/${x.metadata.name}`,
                    label: x.metadata.name,
                  }))}
                  newOption={{
                    label: 'Add new account...',
                    onActivate: async () => {
                      if (!props.shell) throw new Error(`no shell in props`);
                      const cmd = await props.shell.runTaskCommandForResult(props.cmdFrame, entities.activityTask, {
                        type: 'launch-intent',
                        intent: {
                          contextRef: `entity://${entities.api.metadata.namespace}/manifest.dist.app/v1alpha1/Api/${entities.api.metadata.name}`,
                          action: 'app.dist.AddWebAccount',
                          category: 'app.dist.Default',
                          extras: {
                            'vendor-domain': entities.apiBinding.spec.auth?.accountTypeId,
                            'default-server-url': apiSpec?.servers?.[0].url,
                          },
                          // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
                        },
                      });
                      console.log('new acct response:', cmd);
                    },
                  }}
                />
              </>) : (
                <div>None (unauthenticated)</div>
              )}
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{padding: '0.5em 0'}}>
              <button type="submit" className="big button"
                disabled={entities.apiBinding.spec.auth?.required && entities.apiCredentials.length == 0}
                >Allow access</button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );

};
