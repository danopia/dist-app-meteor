import { OpenAPIV3 } from "openapi-types";
import { parse } from "yaml";
import { SpanKind } from "@opentelemetry/api";
import "urlpattern-polyfill";

import { EntityEngine } from "../engine/EntityEngine";
import { ActivityEntity, ApiBindingEntity, ApiEntity } from "../entities/manifest";
import { FetchBodyChunkEntity, FetchRequestEntity, FetchResponseEntity } from "../entities/protocol";
import { ActivityTaskEntity, CommandEntity, FrameEntity, WorkspaceEntity } from "../entities/runtime";
import { meteorCallAsync } from "../lib/meteor-call";
import { serveMarketApi } from "./system-apis/market";
import { serveSessionApi } from "./system-apis/session";
import { makeErrorResponse, makeStatusResponse, makeTextResponse, wrapFetchResponse } from "./fetch-responses";
import { LogicTracer } from "../lib/tracing";
import { serveTelemetryApi } from "./system-apis/telemetry";
import { EntityHandle } from "../engine/EntityHandle";
import { runTaskCommandForResult } from "./workspace-actions";
import { serveCatalogApi } from "./system-apis/catalog";
import { EJSON } from "meteor/ejson";
import { AppInstallationEntity } from "../entities/profile";
import { getAppInstallationEngine } from "./app-engines";

// TODO: This whole file is basically a list of TODOs as I try different things.

const tracer = new LogicTracer({
  name: 'dist.app/fetch-rpc',
  requireParent: false,
});

type FetchHandlerFunc = (rpc: {
  request: FetchRequestEntity['spec'];
  path: string;
  context: FetchRpcHandler;
}) => Promise<FetchResponseEntity['spec']>;

const KnownSystemApis = new Map<string, FetchHandlerFunc>();
KnownSystemApis.set('catalog.v1alpha1.dist.app', serveCatalogApi);
KnownSystemApis.set('market.v1alpha1.dist.app', serveMarketApi);
KnownSystemApis.set('session.v1alpha1.dist.app', serveSessionApi);
KnownSystemApis.set('telemetry.v1alpha1.dist.app', serveTelemetryApi);

type MaybeStreamingResp = Omit<FetchResponseEntity, 'origId'> & {bodyChunks?: ReadableStream<FetchBodyChunkEntity['spec']>};

export class FetchRpcHandler {
  constructor(
    public readonly runtime: EntityEngine,
    public readonly activityTask: ActivityTaskEntity,
    public readonly activity: ActivityEntity,
    public readonly hWorkspace: EntityHandle<WorkspaceEntity>,
  ) {}

  async handle(rpc: FetchRequestEntity): Promise<MaybeStreamingResp> {
    return await tracer.asyncSpan(`fetch-rpc ${rpc.spec.method}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': rpc.spec.method,
        'http.url': rpc.spec.url,
      },
    }, async (span) => {
      const response = await this.handleInner(rpc).catch(makeErrorResponse);
      span?.setAttributes({
        'http.status_code': response.spec.status,
      });
      console.log('IframeHost:', response.spec.status, 'from', rpc.spec.method, rpc.spec.url, {request: rpc.spec, response: response.spec});
      return response;
    });
  }

  async handleInner(rpc: FetchRequestEntity): Promise<MaybeStreamingResp> {
    if (rpc.spec.bodyStream != null) throw new Error(`TODO: streaming request body`);

    if (rpc.spec.url.startsWith('entity://')) {
      return await this
        .handleCatalog(rpc)
        .catch(makeErrorResponse);
    }

    // TODO: task-state can be a system API
    if (rpc.spec.url.startsWith('/task/state/')) {
      return await this.handleTaskState(rpc);
    }

    if (rpc.spec.url == '/task/intent' && rpc.spec.method == 'GET') {
      return wrapFetchResponse({
        status: 200,
        body: EJSON.stringify(this.activityTask.spec.intent ?? {}),
        headers: [['content-type', 'application/json']],
      });
    }

    if (rpc.spec.url.startsWith('/ApiBinding/')) {
      // TODO: maybe these need to be bound
      return await this.handleBinding(rpc);
    }
    if (rpc.spec.url.startsWith('/system-api/telemetry.v1alpha1.dist.app')) {
      const [apiName, ...pathParts] = rpc.spec.url.split('/').slice(2);
      const subPath = pathParts.join('/');
      return await this.handleSystemBinding(rpc, apiName, subPath);
    }

    if (rpc.spec.url.startsWith('/cap/')) {
      return await this.handleCap(rpc);
    }

    return await this.handlePocTodo(rpc);
  }

  @tracer.InternalSpan
  async handleCatalog(rpc: FetchRequestEntity): Promise<MaybeStreamingResp> {
    // console.log('TODO', rpc);
    // const match = new URLPattern({pathname: '/my-namespace/apis/:apiGroup/:apiVersion/:kind/:name'}).exec(new URL('/'+rpc.path, 'http://null'));
    // if (match && rpc.request.method == 'POST' && rpc.request.headers?.find(x => x[0] == 'content-type')?.[1] == 'application/apply-patch+json') {

    // TODO: the app should have its own namespace
    // TODO: the api should be routed by kind, depending on how the kind is defined
    // (e.g. some kinds are not simple entities, and might be more like devices)
    // these below routes can be moved to specifically the dynamic / in-kernel kinds

    const hAppInstallation = this.runtime.getEntityHandle<AppInstallationEntity>(
      'profile.dist.app/v1alpha1', 'AppInstallation',
      this.activityTask.spec.installationNamespace, this.activityTask.spec.installationName);
    const engine = await getAppInstallationEngine(hAppInstallation);

    {
      const match = new URLPattern({pathname: '//:namespace/:apiGroup/:apiVersion/:resourcePlural/list'}).exec(rpc.spec.url);
      if (match && rpc.spec.method == 'GET') {
        const {namespace, apiGroup, apiVersion, resourcePlural} = match.pathname.groups;
        const kind = `${resourcePlural?.[0]?.toUpperCase()}${resourcePlural?.slice(1,-1).replaceAll(/-[a-z]/g, str => str[1].toUpperCase())}`;
        const resources = engine.listEntities(`${apiGroup}/${apiVersion}`, kind!, namespace);
        return wrapFetchResponse({
          status: 200,
          headers: [['content-type', 'application/json']],
          body: EJSON.stringify({items: resources}),
        });
      }
    }

    {
      const match = new URLPattern({pathname: '//:namespace/:apiGroup/:apiVersion/:resourcePlural/stream'}).exec(rpc.spec.url);
      if (match && rpc.spec.method == 'GET') {
        const {namespace, apiGroup, apiVersion, resourcePlural} = match.pathname.groups;
        const kind = `${resourcePlural?.[0]?.toUpperCase()}${resourcePlural?.slice(1,-1).replaceAll(/-[a-z]/g, str => str[1].toUpperCase())}`;
        // TODO: actually cancel these streams eventually
        const signal = new AbortController().signal;
        const stream = await engine.streamEntities(`${apiGroup}/${apiVersion}`, kind!, namespace, signal);
        return {
          kind: 'FetchResponse',
          spec: {
            status: 200,
            headers: [['content-type', 'application/jsonl+entity-stream-events']],
            bodyStream: true,
          },
          bodyChunks: stream.pipeThrough(new TransformStream({
            transform(evt, ctlr) {
              ctlr.enqueue({
                chunk: EJSON.stringify(evt)+'\n',
                isFinal: false,
              });
            },
            flush(ctlr) {
              ctlr.enqueue({
                chunk: '',
                isFinal: true,
              });
            },
          })),
        };
      }
    }

    {
      const match = new URLPattern({pathname: '//:namespace/:apiGroup/:apiVersion/:resourcePlural/by-name/:name'}).exec(rpc.spec.url);
      if (match && rpc.spec.method == 'PATCH' && rpc.spec.headers?.find(x => x[0] == 'content-type')?.[1] == 'application/apply-patch+json') {
        const {namespace, apiGroup, apiVersion, resourcePlural, name} = match.pathname.groups;
        const kind = `${resourcePlural?.[0]?.toUpperCase()}${resourcePlural?.slice(1,-1).replaceAll(/-[a-z]/g, str => str[1].toUpperCase())}`;
        const entityJson = EJSON.parse(`${rpc.spec.body}`);
        console.log({apiGroup, apiVersion, kind, name,entityJson})
        const hEntity = engine.getEntityHandle(`${apiGroup}/${apiVersion}`, kind!, namespace!, name!);
        if (hEntity.get()) {
          await hEntity.mutate(entity => {
            console.log('TODO: i have', {entity}, 'and want to apply', entityJson);
            // TODO: this is terrible!
            //@ts-expect-error: also bad!
            entity.spec = entityJson.spec;
          });
        } else {
          await hEntity.insertNeighbor({
            ...entityJson,
            apiVersion: `${apiGroup}/${apiVersion}`,
            kind: kind!,
            metadata: {
              ...entityJson.metadata,
              name: name!,
            }
          });
        }
        // const resources = engine.listEntities(`${apiGroup}/${apiVersion}`, kind!, namespace);
        return wrapFetchResponse({
          status: 204,
        });
      }
      if (match && rpc.spec.method == 'PUT'/* && rpc.spec.headers?.find(x => x[0] == 'content-type')?.[1] == 'application/json'*/) {
        const {namespace, apiGroup, apiVersion, resourcePlural, name} = match.pathname.groups;
        const kind = `${resourcePlural?.[0]?.toUpperCase()}${resourcePlural?.slice(1,-1).replaceAll(/-[a-z]/g, str => str[1].toUpperCase())}`;
        const entityJson = EJSON.parse(`${rpc.spec.body}`);
        console.log({apiGroup, apiVersion, kind, name,entityJson})
        const hEntity = engine.getEntityHandle(`${apiGroup}/${apiVersion}`, kind!, namespace!, name!);
        if (hEntity.get()) {
          return wrapFetchResponse({
            status: 409,
            body: 'Resource already exists. TODO: what happens when you PUT over something?',
          });
        } else {
          await hEntity.insertNeighbor({
            ...entityJson,
            apiVersion: `${apiGroup}/${apiVersion}`,
            kind: kind!,
            metadata: {
              ...entityJson.metadata,
              name: name!,
            }
          });
        }
        // const resources = engine.listEntities(`${apiGroup}/${apiVersion}`, kind!, namespace);
        return wrapFetchResponse({
          status: 204,
        });
      }
    }

    // {
    //   const match = new URLPattern({pathname: '/my-namespace/create-entity'}).exec(new URL('/'+rpc.path, 'http://null'));
    //   if (match && rpc.spec.method == 'POST') {
    //     const {apiGroup, apiVersion, resourcePlural} = match.pathname.groups;
    //     const kind = `${resourcePlural?.[0]?.toUpperCase()}${resourcePlural?.slice(1,-1).replaceAll(/-[a-z]/g, str => str[1].toUpperCase())}`;
    //     const entityJson = rpc.spec.body;
    //     console.log({entityJson})
    //     throw new Error(`TODO: insert`);
    //     // const resources = engine.insertEntity({

    //     // }`${apiGroup}/${apiVersion}`, kind!, namespace);
    //     // return {
    //     //   status: 200,
    //     //   headers: [['content-type', 'application/json']],
    //     //   body: JSON.stringify({items: resources}),
    //     // };
    //   }
    // }

    return makeTextResponse(404, `TODO: this catalog api is not real`);
  }

  // async handleInner(req: Request): Promise<Response> {
  @tracer.InternalSpan
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
    const impl = KnownSystemApis.get(apiName);
    if (!impl) return makeStatusResponse(404,
      `System API ${JSON.stringify(apiName)} not found`);

    return await tracer.asyncSpan(`system API: ${apiName}`, {
      attributes: {
        'http.path': subPath,
      },
    }, () => impl({
      request: rpc.spec,
      path: subPath,
      context: this,
    })).then(wrapFetchResponse)
      .catch(makeErrorResponse);
  }

  @tracer.InternalSpan
  async handleMountBinding(rpc: FetchRequestEntity, binding: ApiBindingEntity, apiEntity: ApiEntity, apiSpec: OpenAPIV3.Document, defaultServer: string): Promise<Omit<FetchResponseEntity, 'origId'>> {
    console.warn(`TODO: /mount`, {rpc, binding, apiEntity, apiSpec, defaultServer});

    const frame = this.runtime.getEntity<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', this.activityTask.metadata.namespace, this.activityTask.metadata.ownerReferences?.find(x => x.kind == 'Frame')?.name ?? '');
    if (!frame) throw new Error(`no frame, wweird!`);
    const cmd = await runTaskCommandForResult(this.hWorkspace, frame, this.activityTask, {
      type: 'launch-intent',
      intent: {
        contextRef: `entity://${binding.metadata.namespace}/manifest.dist.app/v1alpha1/ApiBinding/${binding.metadata.name}`,
        action: 'app.dist.AuthorizeApiBinding',
        category: 'app.dist.Default',
        // extras: {
        //   'vendor-domain': apiEntity.spec.vendorDomain,
        // },
        // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
      },
    });
    console.log('Got command result:', cmd);
    if (cmd.status?.outcome == 'Completed' && cmd.status.resultRef?.startsWith('cap:')) {
      await this.runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', cmd.metadata.namespace, cmd.metadata.name);
      return makeTextResponse(200, cmd.status.resultRef.slice(4));
    }
    // TODO: how can we wait for the task to complete and take its result?
    return makeStatusResponse(506,
      `Command result: ${cmd.status?.outcome}. TODO: handle unhappy path`);

    // const securitySchemes = apiSpec.components?.securitySchemes;
    // if (!securitySchemes) {
    //   return await this.createCap(binding, defaultServer, null);
    // }

    // const securitySchemeList = Object.entries(securitySchemes).map(x => {
    //   if ('$ref' in x[1]) throw new Error(`TODO: $ref`);
    //   return { def: x[1], id: x[0] };
    // });

    // const accountTypes = this.runtime.listEntities<WebAccountTypeEntity>(
    //   'manifest.dist.app/v1alpha1', 'WebAccountType',
    //   this.activity.metadata.namespace);
    // for (const accountType of accountTypes) {
    //   if (accountType.spec.vendorDomain !== apiEntity.spec.vendorDomain) continue;

    //   if (accountType.spec.credentialScheme == 'ApiKeyOnly') {
    //     const tokenScheme = securitySchemeList.find(x => x.def.type == 'apiKey');
    //     if (tokenScheme?.def.type != 'apiKey') throw new Error('apiKey securityScheme not found');

    //     // TODO!!: there should really be a 'choose account' intent that shows UI

    //     // Find places where we can find the user's existing credentials
    //     const namespaces = Array
    //       .from(this.runtime
    //         .getNamespacesServingApi({
    //           apiVersion: 'profile.dist.app/v1alpha1',
    //           kind: 'ApiCredential',
    //           op: 'Read',
    //         })
    //         .keys());

    //     // Find existing api credentials
    //     // TODO: why is namespace kept as a separate field?
    //     const credentials = namespaces
    //       .flatMap(x => this.runtime
    //         .listEntities<ApiCredentialEntity>(
    //           'profile.dist.app/v1alpha1', 'ApiCredential', x)
    //         .map(entity => ({ ns: x, entity })));

    //     // const apiCredentials = this.runtime.listEntities<ApiCredentialEntity>(
    //     //   'profile.dist.app/v1alpha1', 'ApiCredential',
    //     //   this.activityTask.metadata.namespace);
    //     if (!credentials.length) {
    //       console.info('No ApiCredentials found for scaleway');

    //       if (!namespaces.includes('session')) {
    //         throw new Error(`Cannot store credential without user profile`);
    //       }

    //       const knownApiKey = prompt(stripIndent`
    //         Enter an apiKey for ${defaultServer}
    //         Will be stored in user profile!
    //         (as ${accountType.spec.vendorDomain})`);
    //       if (!knownApiKey) throw new Error(`TODO: no apikey given`);
    //       const credential: ApiCredentialEntity = {
    //         apiVersion: 'profile.dist.app/v1alpha1',
    //         kind: 'ApiCredential',
    //         metadata: {
    //           namespace: 'session',
    //           name: accountType.spec.vendorDomain+'-'+crypto.randomUUID().split('-')[1],
    //         },
    //         spec: {
    //           accountTypeId: accountType.spec.vendorDomain,
    //           authType: 'api-key',
    //           exit: {
    //             type: 'internet',
    //             targetUrl: defaultServer,
    //           },
    //           logging: 'MetadataOnly',
    //           validation: 'Enforced',
    //           exportable: false,
    //         },
    //         secret: {
    //           accessToken: knownApiKey,
    //         },
    //       };
    //       await this.runtime.insertEntity<ApiCredentialEntity>(credential);

    //       credentials.push({ns: credential.metadata.namespace!, entity: credential});
    //     }

    //     if (credentials.length == 1) {
    //       return await this.createCap(binding, defaultServer, credentials[0].entity);
    //     }

    //     // TODO:
    //     console.log({scheme: tokenScheme.def, accountType, credentials });
    //   }
    // }

    // return makeStatusResponse(420,
    //   `Sober up and implement this`);
  }

  // @tracer.InternalSpan
  // async createCap(binding: ApiBindingEntity, defaultServer: string, usingCred: ApiCredentialEntity | null) {
  //   const [app] = this.runtime.listEntities<ApplicationEntity>(
  //     'manifest.dist.app/v1alpha1', 'Application',
  //     binding.metadata.namespace);

  //   const message = [
  //     `NETWORK ACCESS REQUEST:\n`,
  //     `Application ${JSON.stringify(app.metadata.title)}`,
  //     `AppBinding ${JSON.stringify(binding.metadata.name)}\n`,
  //   ];

  //   const serverUrl = usingCred
  //     ? usingCred.spec.exit.targetUrl
  //     : defaultServer;
  //   const credRef = usingCred
  //     ? `${usingCred?.metadata.namespace}/${usingCred?.metadata.name}`
  //     : undefined;

  //   if (usingCred) {
  //     message.push(`Credential ${credRef}`);
  //     message.push(`Server ${serverUrl}\n`);
  //     message.push(`Allow this application to use your credential (!) and access that server through your network?`);
  //   } else {
  //     message.push(`Server ${serverUrl}\n`);
  //     message.push(`Allow this application access that server through your network?`);
  //   }

  //   const gonogo = confirm(message.join('\n'));
  //   if (!gonogo) return makeStatusResponse(403, 'Mount access denied');

  //   const capId = crypto.randomUUID().split('-')[0];
  //   await this.runtime.mutateEntity<ActivityTaskEntity>(
  //     'runtime.dist.app/v1alpha1', 'ActivityTask',
  //     this.activityTask.metadata.namespace, this.activityTask.metadata.name,
  //     ent => {
  //       ent.state.caps ??= {};
  //       if (capId in ent.state.caps) throw new Error(`cap ${capId} already taken??`);
  //       // TODO: separate Capability kind?
  //       ent.state.caps[capId] = {
  //         type: 'HttpClient',
  //         apiBindingRef: `${binding.metadata.namespace}/${binding.metadata.name}`,
  //         apiCredentialRef: credRef,
  //         baseUrl: serverUrl,
  //       };
  //     });

  //   console.log('Returning cap', {capId, server: serverUrl, usingCred: credRef});
  //   return makeTextResponse(200, capId);
  // }

  @tracer.InternalSpan
  async handleCap(rpc: FetchRequestEntity): Promise<Omit<FetchResponseEntity, 'origId'>> {
    const slashIdx = rpc.spec.url.indexOf('/', '/cap/'.length);
    const capId = rpc.spec.url.slice('/cap/'.length, slashIdx);
    const subPath = '/'+rpc.spec.url.slice(slashIdx+1);

    const actTask = this.runtime.getEntity<ActivityTaskEntity>(
      'runtime.dist.app/v1alpha1', 'ActivityTask',
      this.activityTask.metadata.namespace, this.activityTask.metadata.name);
    const cap = actTask?.state.caps?.[capId];
    if (!cap) throw new Error(`BUG: cap not found (${capId})`);

    // console.log({capId, subPath, cap});
    if (cap?.type !== 'HttpClient') throw new Error(`TODO: other cap types`);

    const netRequest: FetchRequestEntity & {} = {
      ...rpc,
      spec: {
        ...rpc.spec,
        url: subPath,
      },
    };

    if (cap.apiBindingRef) {
      const binding = this.runtime.getEntity<ApiBindingEntity>(
        'manifest.dist.app/v1alpha1', 'ApiBinding',
        decodeURIComponent(cap.apiBindingRef.split('/')[0]),
        decodeURIComponent(cap.apiBindingRef.split('/')[1]));
      if (!binding) return makeStatusResponse(404,
        `ApiBinding ${JSON.stringify(cap.apiBindingRef)} not found`);

    }

    // const apiCredRef = cap.apiCredentialRef?.split('/');
    // if (apiCredRef) {
    //   const credential = this.runtime.getEntity<ApiCredentialEntity>(
    //     'profile.dist.app/v1alpha1', 'ApiCredential',
    //     apiCredRef[0], apiCredRef[1],
    //   );
    //   if (!credential) return makeStatusResponse(404, `The referenced credential was not found`);

    //   if (credential.spec.authType !== 'api-key') throw new Error(
    //     `TODO: other auth-types from cap cred`);

    //   const { accessToken } = credential.secret ?? {};
    //   if (accessToken) {
    //     // TODO: use securitySchemes to figure out how to insert the token
    //     // this was already impl'd elsewhere in the file
    //     netRequest.spec.headers!.push(['x-auth-token', accessToken]);
    //   }
    //   // return makeStatusResponse(420, 'TODEO');
    // }

    // TODO: this.runtime.submitEntity

    const resp = await meteorCallAsync<FetchResponseEntity>('/v1alpha1/Entity/submit', {
      kind: 'CapCall',
      spec: {
        request: netRequest,
        cap: cap,
        appInstallationRef: [
          this.activityTask.spec.installationNamespace,
          this.activityTask.spec.installationName,
        ].map(x => encodeURIComponent(x)).join('/'),
      },
    });
    // console.log('IframeHost cap server fetch result:', rpc, resp);
    return resp;
  }

  @tracer.InternalSpan
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
    return makeStatusResponse(513, 'Deprecated - update to mount API');
  }

  @tracer.InternalSpan
  async handlePocTodo(rpc: FetchRequestEntity): Promise<Omit<FetchResponseEntity, 'origId'>> {

    // TODO BEGIN
    const resp = await meteorCallAsync<FetchResponseEntity>('poc-FetchRequestEntity', rpc);
    console.log('IframeHost profile fetch result:', resp);
    // TODO END

    return resp;
  }
}
