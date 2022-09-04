import { OpenAPIV3 } from "openapi-types";
import { parse } from "yaml";
import { EntityEngine } from "../engine/EntityEngine";
import { ActivityEntity, ApiEntity } from "../entities/manifest";
import { FetchRequestEntity, FetchResponseEntity } from "../entities/protocol";
import { ActivityInstanceEntity } from "../entities/runtime";
import { meteorCallAsync } from "../lib/meteor-call";

export class FetchRpcHandler {
  constructor(
    private readonly runtime: EntityEngine,
    private readonly activityInstance: ActivityInstanceEntity,
    private readonly activity: ActivityEntity,
  ) {}

  async handle(rpc: FetchRequestEntity): Promise<Omit<FetchResponseEntity, 'origId'>> {
    console.log('ActivityEmbed fetch', rpc);
    if (rpc.spec.bodyStream != null) throw new Error(`TODO: stream`);

    if (rpc.spec.url.startsWith('/task/state/')) {
      const stateKey = decodeURIComponent(rpc.spec.url.split('/')[2]);
      // console.log('task/state', {method: rpc.spec.method, stateKey, data: rpc.spec.body});
      if (rpc.spec.method == 'GET') {
        const {appState} = this.runtime.getEntity<ActivityInstanceEntity>('runtime.dist.app/v1alpha1', 'ActivityInstance', this.activityInstance.metadata.namespace, this.activityInstance.metadata.name)?.spec ?? {};
        if (appState?.[stateKey] != null) return {
          kind: 'FetchResponse',
          spec: {
            status: 200,
            body: appState[stateKey],
            headers: [['content-type', 'text/plain']],
          },
        };
        return {
          kind: 'FetchResponse',
          spec: {
            status: 404,
            body: `no state exists here yet (TODO)`,
            headers: [['content-type', 'text/plain']],
          },
        };
      }
      const newBody = typeof rpc.spec.body == 'string' ? rpc.spec.body : new TextDecoder().decode(rpc.spec.body);
      this.runtime.mutateEntity<ActivityInstanceEntity>('runtime.dist.app/v1alpha1', 'ActivityInstance', this.activityInstance.metadata.namespace, this.activityInstance.metadata.name, actInst => {
        actInst.spec.appState ??= {};
        actInst.spec.appState[stateKey] = newBody;
      });
      return {
        kind: 'FetchResponse',
        spec: {
          status: 200,
          body: `ok`,
          headers: [['content-type', 'text/plain']],
        },
      };
    }

    if (rpc.spec.url.startsWith('/binding/')) {
      const slashIdx = rpc.spec.url.indexOf('/', '/binding/'.length);
      const bindingName = rpc.spec.url.slice('/binding'.length, slashIdx);
      const subPath = rpc.spec.url.slice(slashIdx+1);

      const binding = this.activity.spec.fetchBindings?.find(x => x.pathPrefix == bindingName);
      if (!binding) return {
        kind: 'FetchResponse',
        spec: {
          status: 404,
          body: `No binding ${JSON.stringify(bindingName)} exists`,
          headers: [['content-type', 'text/plain']],
        },
      };
      const apiEntity = this.runtime.getEntity<ApiEntity>('manifest.dist.app/v1alpha1', 'Api', this.activity.metadata.namespace, binding.apiName);
      if (!apiEntity) return {
        kind: 'FetchResponse',
        spec: {
          status: 404,
          body: `Binding ${JSON.stringify(bindingName)} lacks extant Api entity`,
          headers: [['content-type', 'text/plain']],
        },
      };
      const apiSpec: OpenAPIV3.Document = parse(apiEntity.spec.definition);
      const server = apiSpec.servers?.[0];
      if (!server || !server.url.startsWith('https://')) return {
        kind: 'FetchResponse',
        spec: {
          status: 404,
          body: `Binding ${JSON.stringify(bindingName)} has no server available`,
          headers: [['content-type', 'text/plain']],
        },
      };

      const realUrl = new URL(subPath, server.url).toString();
      if (!realUrl.startsWith(server.url)) throw new Error(`url breakout attempt?`);

      const pathConfig = Object.entries(apiSpec.paths).filter(x => {
        const patStr = x[0].replace(/\{([^{}]+)\}/g, y => `:${y.slice(1,-1)}`);
        //@ts-expect-error URLPattern not yet typed
        const pat = new URLPattern(patStr, server.url);
        return pat.test(realUrl);
      }).map(x => ({...(x[1] ?? {}), path: x[0]}))[0];
      const methodConfig = pathConfig?.[rpc.spec.method.toLowerCase() as 'get'];
      if (!pathConfig || !methodConfig) throw new Error(`API lookup of ${subPath} failed`); // TODO: HTTP 430

      secLoop: for (const security of methodConfig.security ?? apiSpec.security ?? []) {
        const [secType, secScopes] = Object.entries(security)[0];
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

      if ((server as {} as Record<string,unknown>)['x-cors-enabled'] === false) {
        // TODO: some sort of security model between browser and relay
        const resp = await meteorCallAsync<FetchResponseEntity>('poc-FetchRequestEntity', {
          ...rpc,
          spec: {
            ...rpc.spec,
            url: 'dist-app:/protocolendpoints/openapi/proxy/https/'+realUrl.replace(/^[^:]+:\/\//, ''),
          },
        });
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

    // TODO BEGIN
    const resp = await meteorCallAsync<FetchResponseEntity>('poc-FetchRequestEntity', rpc);
    console.log('ActivityEmbed fetch result:', resp);
    // TODO END

    return resp;
  }
}

function isReferenceObject(ref: unknown): ref is OpenAPIV3.ReferenceObject {
  if (!ref || typeof ref !== 'object') return false;
  const refObj = ref as Record<string,unknown>;
  return typeof refObj.$ref == 'string';
}
