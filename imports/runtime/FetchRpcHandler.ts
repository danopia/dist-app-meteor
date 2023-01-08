import { OpenAPIV3 } from "openapi-types";
import { parse } from "yaml";
import "urlpattern-polyfill";

import { EntityEngine } from "../engine/EntityEngine";
import { ActivityEntity, ApiBindingEntity, ApiEntity, WebAccountTypeEntity } from "../entities/manifest";
import { FetchRequestEntity, FetchResponseEntity } from "../entities/protocol";
import { ActivityTaskEntity } from "../entities/runtime";
import { meteorCallAsync } from "../lib/meteor-call";
import { serveMarketApi } from "./system-apis/market";
import { serveSessionApi } from "./system-apis/session";
import { ApiCredentialEntity } from "../entities/profile";
import { stripIndent } from "common-tags";

// This whole file is basically a list of TODOs as I try different things.

export class FetchRpcHandler {
  constructor(
    public readonly runtime: EntityEngine,
    public readonly activityTask: ActivityTaskEntity,
    public readonly activity: ActivityEntity,
  ) {}

  async handle(rpc: FetchRequestEntity): Promise<Omit<FetchResponseEntity, 'origId'>> {
    const response = await this.handleInner(rpc).catch(makeErrorResponse);
    console.log('IframeHost:', response.spec.status, 'from', rpc.spec.method, rpc.spec.url, {request: rpc.spec, response: response.spec});
    return response;
  }

  async handleInner(rpc: FetchRequestEntity): Promise<Omit<FetchResponseEntity, 'origId'>> {
    if (rpc.spec.bodyStream != null) throw new Error(`TODO: stream`);

    // TODO: task-state can be a system API
    if (rpc.spec.url.startsWith('/task/state/')) {
      return await this.handleTaskState(rpc);
    }

    if (rpc.spec.url.startsWith('/ApiBinding/')) {
      // TODO: maybe these need to be bound
      return await this.handleBinding(rpc);
    }

    return await this.handlePocTodo(rpc);
  }

  // async handleInner(req: Request): Promise<Response> {
  async handleTaskState(rpc: FetchRequestEntity): Promise<Omit<FetchResponseEntity, 'origId'>> {
    const stateKey = decodeURIComponent(rpc.spec.url.split('/')[3]);
    // console.log('task/state', {method: rpc.spec.method, stateKey, data: rpc.spec.body});

    if (rpc.spec.method == 'GET') {
      const { appData } = this.runtime.getEntity<ActivityTaskEntity>(
        'runtime.dist.app/v1alpha1', 'ActivityTask',
        this.activityTask.metadata.namespace, this.activityTask.metadata.name,
      )?.state ?? {};

      if (appData?.[stateKey] != null) {
        return makeTextResponse(200, appData[stateKey]);
      }
      return makeStatusResponse(404, `no state exists here yet (TODO)`);
    }

    const newBody = typeof rpc.spec.body == 'string'
      ? rpc.spec.body
      : new TextDecoder().decode(rpc.spec.body);
    await this.runtime.mutateEntity<ActivityTaskEntity>(
      'runtime.dist.app/v1alpha1', 'ActivityTask',
      this.activityTask.metadata.namespace, this.activityTask.metadata.name,
      actInst => {
        actInst.state.appData ??= {};
        actInst.state.appData[stateKey] = newBody;
      });
    return makeTextResponse(200, `ok`);
  }

  async handleSystemBinding(rpc: FetchRequestEntity, apiName: string, subPath: string): Promise<Omit<FetchResponseEntity, 'origId'>> {
    const impl = ({
      'market.v1alpha1.dist.app': serveMarketApi,
      'session.v1alpha1.dist.app': serveSessionApi,
    })[apiName];
    if (!impl) return makeStatusResponse(404,
      `System API ${JSON.stringify(apiName)} not found`);

    return await impl({
      request: rpc.spec,
      path: subPath,
      context: this,
    }).then<Omit<FetchResponseEntity, 'origId'>>(x => ({kind: 'FetchResponse', spec: x}))
      .catch(makeErrorResponse);
  }

  async handleMountBinding(rpc: FetchRequestEntity, binding: ApiBindingEntity, apiEntity: ApiEntity, apiSpec: OpenAPIV3.Document, defaultServer: string): Promise<Omit<FetchResponseEntity, 'origId'>> {
    console.warn(`TODO: /mount`, {rpc, binding, apiEntity, apiSpec, defaultServer});

    const securitySchemes = apiSpec.components?.securitySchemes;
    if (!securitySchemes) return makeStatusResponse(400,
      `No securitySchemes found in API definition`);
    const securitySchemeList = Object.entries(securitySchemes).map(x => {
      if ('$ref' in x[1]) throw new Error(`TODO: $ref`);
      return { def: x[1], id: x[0] };
    });

    const accountTypes = this.runtime.listEntities<WebAccountTypeEntity>(
      'manifest.dist.app/v1alpha1', 'WebAccountType',
      this.activity.metadata.namespace);
    for (const accountType of accountTypes) {
      if (accountType.spec.vendorDomain !== apiEntity.spec.vendorDomain) continue;

      if (accountType.spec.credentialScheme == 'ApiKeyOnly') {
        const tokenScheme = securitySchemeList.find(x => x.def.type == 'apiKey');
        if (tokenScheme?.def.type != 'apiKey') throw new Error('apiKey securityScheme not found');

        // TODO!!: there should really be a 'choose account' intent that shows UI

        // Find places where we can find the user's existing credentials
        const namespaces = Array
          .from(this.runtime
            .getNamespacesServingApi({
              apiVersion: 'profile.dist.app/v1alpha1',
              kind: 'ApiCredential',
              op: 'Read',
            })
            .keys());

        // Find existing api credentials
        const credentials = namespaces
          .flatMap(x => this.runtime
            .listEntities<ApiCredentialEntity>(
              'profile.dist.app/v1alpha1', 'ApiCredential', x)
            .map(entity => ({ ns: x, entity })));

        // const apiCredentials = this.runtime.listEntities<ApiCredentialEntity>(
        //   'profile.dist.app/v1alpha1', 'ApiCredential',
        //   this.activityTask.metadata.namespace);
        if (!credentials.length) {
          console.info('No ApiCredentials found for scaleway');

          if (!namespaces.includes('profile:user')) {
            throw new Error(`Cannot store credential without user profile`);
          }

          const knownApiKey = prompt(stripIndent`
            Enter an apiKey for ${defaultServer}
            Will be stored in user profile!
            (as ${accountType.spec.vendorDomain})`);
          if (!knownApiKey) throw new Error(`TODO: no apikey given`);
          const credential: ApiCredentialEntity = {
            apiVersion: 'profile.dist.app/v1alpha1',
            kind: 'ApiCredential',
            metadata: {
              namespace: 'profile:user',
              name: accountType.spec.vendorDomain+'-'+crypto.randomUUID().split('-')[1],
            },
            spec: {
              accountTypeId: accountType.spec.vendorDomain,
              authType: 'api-key',
              exit: {
                type: 'internet',
                targetUrl: defaultServer,
              },
              logging: 'MetadataOnly',
              validation: 'Enforced',
              exportable: false,
            },
          };
          await this.runtime.insertEntity<ApiCredentialEntity>(credential);

          credentials.push({ns: credential.metadata.namespace!, entity: credential});
        }

        if (credentials.length == 1) {
          const usingCred = credentials[0];

          const capId = crypto.randomUUID().split('-')[0];
          await this.runtime.mutateEntity<ActivityTaskEntity>('runtime.dist.app/v1alpha1', 'ActivityTask', this.activityTask.metadata.namespace, this.activityTask.metadata.name, ent => {
            ent.state.caps ??= {};
            if (capId in ent.state.caps) throw new Error(`cap ${capId} already taken??`);
            ent.state.caps[capId] = {
              type: 'HttpClient',
              apiBindingRef: `${binding.metadata.namespace}/${binding.metadata.name}`,
              apiCredentialRef: `${usingCred.ns}/${usingCred.entity.metadata.name}`,
              baseUrl: defaultServer,
            };
          });

          console.log('Returning', {capId});
          return makeStatusResponse(200, capId);
        }

        console.log({scheme: tokenScheme.def, accountType, credentials });
      }
    }

    return makeStatusResponse(420,
      `Sober up and implement this`);
  }

  async handleBinding(rpc: FetchRequestEntity): Promise<Omit<FetchResponseEntity, 'origId'>> {
    const slashIdx = rpc.spec.url.indexOf('/', '/ApiBinding/'.length);
    const bindingName = rpc.spec.url.slice('/ApiBinding/'.length, slashIdx);
    const subPath = rpc.spec.url.slice(slashIdx+1);

    const binding = this.runtime.getEntity<ApiBindingEntity>(
      'manifest.dist.app/v1alpha1', 'ApiBinding',
      this.activity.metadata.namespace, bindingName);
    if (!binding) return makeStatusResponse(404,
      `ApiBinding ${JSON.stringify(bindingName)} not found`);

    if (binding.spec.apiName.endsWith('.v1alpha1.dist.app')) {
      return await this.handleSystemBinding(rpc, binding.spec.apiName, subPath);
    }

    const apiEntity = this.runtime.getEntity<ApiEntity>(
      'manifest.dist.app/v1alpha1', 'Api',
      this.activity.metadata.namespace, binding.spec.apiName);
    if (!apiEntity) return makeStatusResponse(404,
      `ApiBinding ${JSON.stringify(bindingName)} lacks extant Api entity`);

    if (apiEntity.spec.type !== 'openapi') throw new Error(
      `TODO: non-openapi Api entity: ${JSON.stringify(apiEntity.spec.type)}`);

    const apiSpec: OpenAPIV3.Document = parse(apiEntity.spec.definition);
    const server = apiSpec.servers?.[0];
    if (!server || !server.url.startsWith('https://')) return makeStatusResponse(404,
      `ApiBinding ${JSON.stringify(bindingName)} has no server available`);

    if (subPath == 'mount') {
      return this.handleMountBinding(rpc, binding, apiEntity, apiSpec, server.url);
    }

    const realUrl = new URL(subPath, server.url).toString();
    if (!realUrl.startsWith(server.url)) throw new Error(`url breakout attempt?`);

    const pathConfig = Object.entries(apiSpec.paths).filter(x => {
      const patStr = x[0].replace(/\{([^{}]+)\}/g, y => `:${y.slice(1,-1)}`);
      const pat = new URLPattern({pathname: patStr});
      return pat.test(new URL('/'+subPath, 'https://.'));
    }).map(x => ({...(x[1] ?? {}), path: x[0]}))[0];
    const methodConfig = pathConfig?.[rpc.spec.method.toLowerCase() as 'get'];
    if (!pathConfig || !methodConfig) throw new Error(`API lookup of ${subPath} failed`); // TODO: HTTP 430

    // TODO: replace this with proper ApiCredential stuff
    secLoop: for (const security of methodConfig.security ?? apiSpec.security ?? []) {
      const secType = Object.keys(security)[0];
      const secDef = apiSpec.components?.securitySchemes?.[secType];
      if (!secDef || isReferenceObject(secDef)) throw new Error(`TODO, isReferenceObject`);
      switch (secDef?.type) {
        case 'apiKey': {
          if (secDef.in !== 'header') throw new Error(`TODO: apiKey in ${secDef.in}`);
          // TODO: actual secret storage i hope
          const storageKey = `dist.app/credential/apiKey/${server.url}`;
          let knownApiKey = localStorage[storageKey];
          if (!knownApiKey) {
            knownApiKey = prompt(`apiKey for ${secType}`);
            if (!knownApiKey) throw new Error(`TODO: no apikey given`);
            localStorage[storageKey] = knownApiKey;
          }
          rpc.spec.headers ??= [];
          rpc.spec.headers.push([secDef.name, knownApiKey]);
          break secLoop;
        }; break;
        default: throw new Error(`TODO: openapi sec type ${secDef.type}`);
      }
    }

    if (apiEntity.spec.crossOriginResourceSharing === 'restricted') {
      // TODO: some sort of security model between browser and relay
      const resp = await meteorCallAsync<FetchResponseEntity>('poc-FetchRequestEntity', {
        ...rpc,
        spec: {
          ...rpc.spec,
          url: 'dist-app:/protocolendpoints/openapi/proxy/https/'+realUrl.replace(/^[^:]+:\/\//, ''),
        },
      });
      console.log('IframeHost server fetch result:', resp);
      return resp;
    }

    const t0 = new Date;
    const realResp = await fetch(realUrl, {
      method: rpc.spec.method,
      headers: rpc.spec.headers,
      body: rpc.spec.body ?? undefined,
      redirect: 'manual',
    });
    const firstByte = Date.now() - t0.valueOf();
    const respBody = new Uint8Array(await realResp.arrayBuffer())
    const lastByte = Date.now() - t0.valueOf();

    let body: Uint8Array | string = respBody;
    if (realResp.headers.get('content-type')?.startsWith('text/') && body.length < (1*1024*1024)) {
      body = new TextDecoder().decode(body);
      if (body[0] == '{' || body[0] == '[') body = JSON.parse(body);
    }
    console.log('IframeHost local fetch result:', body);

    return {
      kind: 'FetchResponse',
      spec: {
        status: realResp.status,
        body: respBody,
        headers: Array.from(realResp.headers),
        timing: {
          startedAt: t0,
          firstByteMillis: firstByte,
          completedMillis: lastByte,
        }
      },
    };
  }

  async handlePocTodo(rpc: FetchRequestEntity): Promise<Omit<FetchResponseEntity, 'origId'>> {

    // TODO BEGIN
    const resp = await meteorCallAsync<FetchResponseEntity>('poc-FetchRequestEntity', rpc);
    console.log('IframeHost profile fetch result:', resp);
    // TODO END

    return resp;
  }
}

function isReferenceObject(ref: unknown): ref is OpenAPIV3.ReferenceObject {
  if (!ref || typeof ref !== 'object') return false;
  const refObj = ref as Record<string,unknown>;
  return typeof refObj.$ref == 'string';
}

const makeErrorResponse = (err: Error) => makeTextResponse(500, err.stack ?? `Server Error`);
const makeStatusResponse = (status: number, message: string) => makeTextResponse(status, `${status}: ${message}`);
function makeTextResponse(status: number, body: string): Omit<FetchResponseEntity, 'origId'> {
  return {
    kind: 'FetchResponse',
    spec: {
      status, body,
      headers: [['content-type', 'text/plain']],
    },
  };
}
