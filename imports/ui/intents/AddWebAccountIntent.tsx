import './access-request.css';

import { useTracker } from 'meteor/react-meteor-data';
import { OpenAPIV3 } from 'openapi-types';
import React, { useMemo, useState } from 'react';
import { parse } from 'yaml';
import { EntityEngine } from '/imports/engine/EntityEngine';
import { ApiEntity, WebAccountTypeEntity } from '/imports/entities/manifest';
import { ApiCredentialEntity } from '/imports/entities/profile';
import { CommandEntity, FrameEntity, WorkspaceEntity } from '/imports/entities/runtime';
import { RadioButtonList } from './RadioButtonList';
import { deleteFrame } from '/imports/runtime/workspace-actions';
import { EntityHandle } from '/imports/engine/EntityHandle';

export const AddWebAccountIntent = (props: {
  runtime: EntityEngine,
  // apiBinding: ApiBindingEntity;
  command: CommandEntity;
  cmdFrame: FrameEntity;
  hWorkspace: EntityHandle<WorkspaceEntity>;
}) => {
  if (props.command.spec.type !== 'launch-intent') throw new Error(`not a launch-intent command`);
  const intent = props.command.spec.intent;

  // console.log('cmd', props.command)
  const match = new URLPattern({
    protocol: 'entity:',
    pathname: "//:namespace/:api/:version/:kind/:name",
  }).exec(intent.contextRef);
  if (!match) throw new Error(`failed urlpattern on ${intent.contextRef}`);
  const {api, kind, name, namespace} = match.pathname.groups as Record<string,string>;
  // console.log({api, kind, name, namespace, version})
  if (api !== 'manifest.dist.app' || kind !== 'Api') throw new Error(`not an Api`);

  const entities = useTracker(() => {
    // console.warn('fetching entities for AddWebAccount');

    const api = props.runtime.getEntity<ApiEntity>('manifest.dist.app/v1alpha1', 'Api', namespace, name);
    if (!api) return {error: `no api`};

    const accountTypes = api.spec.vendorDomain ? props.runtime.findAllEntities<WebAccountTypeEntity>(
      'manifest.dist.app/v1alpha1', 'WebAccountType').flatMap(x => x.entity.spec.vendorDomain == api.spec.vendorDomain ? [x.entity] : []) : [];

    return {
      api,
      accountType: accountTypes[0],
    };
  }, [props.runtime, name, namespace]);
  console.log('AddWebAccount', {entities});

  const apiSpec = useMemo(() => {
    if (!entities.api) return null;
    if (entities.api && entities.api.spec.type !== 'openapi') throw new Error(
      `TODO: non-openapi Api entity: ${JSON.stringify(entities.api.spec.type)}`);
    return parse(entities.api.spec.definition) as OpenAPIV3.Document;
  }, [entities.api]);

  // const [serverUrl, setServerUrl] = useState('');
  // const [customUrl, setCustomUrl] = useState('');
  // const [deviceRef, setDeviceRef] = useState('');
  // const [credentialRef, setCredentialRef] = useState('');
  const [securityScheme, setSecurityScheme] = useState('');

  if (!entities.api) {
    return (
      <div>waiting: {entities.error}</div>
    );
  }
  // const vendorDomain = `${intent.extras?.['vendor-domain']}`;
  // const defaultServerUrl = `${intent.extras?.['default-server-url']}`;


  const securitySchemes = Object.entries(apiSpec?.components?.securitySchemes ?? {})
    .map(x => ({id: x[0], ...x[1]}))
    .flatMap(x => isReferenceObject(x) ? [] : [x]);
    // .filter(x => isReferenceObject(x[1]));
  const securitySchemeDef = securitySchemes.find(x => x.id == securityScheme);
  const secretType = (securitySchemeDef?.type == 'apiKey' || (securitySchemeDef?.type == 'http' && securitySchemeDef?.scheme == 'bearer')) ? 'static-token' : 'TODO';

  return (
    <form className="activity-contents-wrap" style={{display: 'flex', flexDirection: 'column', gap: '1em', padding: '1em', alignItems: 'center'}} onSubmit={evt => {
      evt.preventDefault();
      const target = evt.currentTarget as {
        accountDomain?: HTMLInputElement;
        description?: HTMLInputElement;
        securityScheme?: RadioNodeList;
        staticToken?: HTMLInputElement;
        keepOnServer?: HTMLInputElement;
        blockExport?: HTMLInputElement;
      };
      const values = {
        accountDomain: target.accountDomain?.value,
        description: target.description?.value,
        securityScheme: target.securityScheme?.value,
        staticToken: target.staticToken?.value,
        keepOnServer: target.keepOnServer?.checked,
        blockExport: target.blockExport?.checked,
      };

      if (!values.accountDomain || values.accountDomain !== entities.accountType.spec.vendorDomain) {
        throw new Error(`wrong accountDomain`);
      }
      if (values.securityScheme !== securitySchemeDef?.id) {
        throw new Error(`wrong securityScheme`);
      }

      const credentialName = entities.accountType.spec.vendorDomain+'-'+crypto.randomUUID().split('-')[0];
      console.log('Creating credential with inputs:', {credentialName, values});
      const credential: ApiCredentialEntity = {
        apiVersion: 'profile.dist.app/v1alpha1',
        kind: 'ApiCredential',
        metadata: {
          namespace: 'session', // TODO: dynamic workspace
          name: credentialName,
          description: values.description,
        },
        spec: {
          accountTypeId: values.accountDomain,
          authType: secretType == 'static-token' ? 'api-key' : 'api-key',
          exit: {
            type: 'internet',
            // targetUrl: defaultServer,
          },
          restrictions: {
            keepOnServer: values.keepOnServer,
            blockExport: values.blockExport,
          },
          logging: 'MetadataOnly',
          validation: 'Enforced',
          // exportable: false,
        },
        secret: secretType == 'static-token' ? {
          accessToken: values.staticToken,
        } : {},
      };

      (async () => {
        await props.runtime.insertEntity(credential);
        await props.runtime.mutateEntity<CommandEntity>(
          'runtime.dist.app/v1alpha1', 'Command',
          props.command.metadata.namespace, props.command.metadata.name,
          x => {
            x.status = {
              outcome: 'Completed',
              resultRef: `credential:${credential.metadata.name}`,
            };
          });
        deleteFrame(props.hWorkspace, props.cmdFrame.metadata.name);
      })();
    }}>
      <h2 style={{margin: 0}}>Add Web Account</h2>
      <p style={{margin: 0}}>Connect a third-party account to your dist.app profile.</p>
      <table className="access-request-table">
        <tbody>
          <tr>
            <th>Account type:</th>
            <td style={{padding: '0.5em 0'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                {/* <pre style={{margin: 0}}>{entities.accountType.spec.vendorDomain}</pre> */}
                <input className="button" type="text" name="accountDomain" value={entities.accountType.spec.vendorDomain} disabled />
              </div>
            </td>
          </tr>
          <tr>
            <th>Description:</th>
            <td style={{padding: '0.5em 0'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                <input className="button" type="text" name="description" placeholder="(Note for your own records)" />
              </div>
            </td>
          </tr>
          <tr>
            <th>Auth method:</th>
            <td style={{padding: '0.5em 0'}}>
              <RadioButtonList
                name="securityScheme"
                required
                onChange={evt => {
                  setSecurityScheme(evt.currentTarget.value);
                }}
                options={[
                  ...securitySchemes.map(x => ({
                    id: x.id,
                    label: `${x.id} (${x.type})`,
                    ...(x.type !== 'http' ? {
                      disabled: true,
                      message: 'TODO: Not supported yet',
                    } : {})
                  })) ?? [],
                ]}
              />
            </td>
          </tr>
          {securitySchemeDef ? (<>
            <tr>
              <td colSpan={2} style={{textAlign: 'center'}}>
                <hr />
                <h3 style={{margin: 0}}>{securityScheme}</h3>
                <p style={{margin: 0}}>{securitySchemeDef.description}</p>
              </td>
            </tr>
            {secretType == 'static-token' ? (
              <tr>
                <th>Static token:</th>
                <td style={{padding: '0.5em 0'}}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                    <input className="button" type="text" name="staticToken" required />
                  </div>
                </td>
              </tr>
            ) : [/*TODO*/]}
            <tr>
              <td colSpan={2}>
                <hr />
              </td>
            </tr>
          </>) : []}
          <tr>
            <th>Extra safety:</th>
            <td style={{padding: '0.5em 0'}}>
              <RadioButtonList
                name=""
                options={[
                  {
                    id: 'keepOnServer',
                    label: `Restrict to only server-side processing`,
                    message: 'Prevents usage in requests sent from your browser',
                    props: { type: 'checkbox', name: 'StayOnServer' },
                  },
                  {
                    id: 'blockExport',
                    label: `Block displaying secret value in clear-text`,
                    props: { type: 'checkbox', name: 'StayOnServer' },
                  },
                  // {
                  //   id: 'requireHttpLogging',
                  //   label: `Require logging all HTTP requests`,
                  //   props: { type: 'checkbox', name: 'StayOnServer' },
                  // },
                ]}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{padding: '0.5em 0'}}>
              <button type="submit" className="big button"
                >Add account</button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );

};

function isReferenceObject(ref: unknown): ref is OpenAPIV3.ReferenceObject {
  if (!ref || typeof ref !== 'object') return false;
  const refObj = ref as Record<string,unknown>;
  return typeof refObj.$ref == 'string';
}
