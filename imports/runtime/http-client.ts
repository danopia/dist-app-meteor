import { OpenAPIV3 } from "openapi-types";
import { parse } from "yaml";
import { ApiBindingEntity, ApiEntity } from "../entities/manifest";
import { ApiCredentialEntity } from "../entities/profile";
import { makeStatusResponse } from "./fetch-responses";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { FetchRequestEntity } from "/imports/entities/protocol";
import "urlpattern-polyfill";

import { fetch } from 'meteor/fetch';

export async function performHttpRequest(runtime: EntityEngine, opts: {
  rpc: FetchRequestEntity;
  appNamespace: string;
  apiBindingName: string;
  apiCredential: ApiCredentialEntity | null;
}) {
  const subPath = opts.rpc.spec.url.slice(1);

  const binding = runtime.getEntity<ApiBindingEntity>(
    'manifest.dist.app/v1alpha1', 'ApiBinding',
    opts.appNamespace, opts.apiBindingName);
  if (!binding) return makeStatusResponse(404,
    `ApiBinding ${JSON.stringify(opts.apiBindingName)} not found`);

  if (binding.spec.apiName.endsWith('.v1alpha1.dist.app')) return makeStatusResponse(500,
    `System APIs are not implemented on the server yet.`);
    // return await this.handleSystemBinding(rpc, binding.spec.apiName, subPath);

  const apiEntity = runtime.getEntity<ApiEntity>(
    'manifest.dist.app/v1alpha1', 'Api',
    opts.appNamespace, binding.spec.apiName);
  if (!apiEntity) return makeStatusResponse(404,
    `ApiBinding ${JSON.stringify(opts.apiBindingName)} lacks extant Api entity`);

  if (apiEntity.spec.type !== 'openapi') throw new Error(
    `TODO: non-openapi Api entity: ${JSON.stringify(apiEntity.spec.type)}`);

  const apiSpec: OpenAPIV3.Document = parse(apiEntity.spec.definition);
  const server = apiSpec.servers?.[0];
  if (!server || !server.url.startsWith('https://')) return makeStatusResponse(404,
    `ApiBinding ${JSON.stringify(opts.apiBindingName)} has no server available`);

  // if (subPath == 'mount') {
  //   return this.handleMountBinding(rpc, binding, apiEntity, apiSpec, server.url);
  // }
  // return makeStatusResponse(512, 'Deprecated - update to mount API');

  const realUrl = new URL(subPath, server.url).toString();
  if (!realUrl.startsWith(server.url)) throw new Error(`url breakout attempt? ${realUrl} vs. ${server.url}`);

  const pathConfig = Object.entries(apiSpec.paths).filter(x => {
    const patStr = x[0].replace(/\{([^{}]+)\}/g, y => `:${y.slice(1,-1)}`);
    const pat = new URLPattern({pathname: patStr});
    return pat.test(new URL('/'+subPath, 'https://.'));
  }).map(x => ({...(x[1] ?? {}), path: x[0]}))[0];
  const methodConfig = pathConfig?.[opts.rpc.spec.method.toLowerCase() as 'get'];
  if (!pathConfig || !methodConfig) throw new Error(`API lookup of ${opts.rpc.spec.method} ${subPath} failed`); // TODO: HTTP 430

  // TODO: replace this with proper ApiCredential stuff
  secLoop: for (const security of methodConfig.security ?? apiSpec.security ?? []) {
    const secType = Object.keys(security)[0];
    const secDef = apiSpec.components?.securitySchemes?.[secType];
    if (!secDef || isReferenceObject(secDef)) throw new Error(`TODO, isReferenceObject`);
    switch (secDef?.type) {
      case 'apiKey': {
        if (secDef.in !== 'header') throw new Error(`TODO: apiKey in ${secDef.in}`);
        // TODO: actual secret storage i hope
        if (!opts.apiCredential) return makeStatusResponse(403,
          `No ApiCredential available for request`);
        if (!opts.apiCredential.secret?.accessToken) return makeStatusResponse(403,
          `BUG: Available ApiCredential doesn't have a secret`);
        opts.rpc.spec.headers ??= [];
        opts.rpc.spec.headers = opts.rpc.spec.headers.filter(x => x[0].toLowerCase() !== secDef.name.toLowerCase());
        opts.rpc.spec.headers.push([secDef.name, opts.apiCredential.secret.accessToken]);
        break secLoop;
      } break;
      case 'http': {
        if (secDef.scheme !== 'bearer') throw new Error(`TODO: http scheme ${secDef.scheme}`);
        // TODO: actual secret storage i hope
        if (!opts.apiCredential) return makeStatusResponse(403,
          `No ApiCredential available for request`);
        if (!opts.apiCredential.secret?.accessToken) return makeStatusResponse(403,
          `BUG: Available ApiCredential doesn't have a secret`);
        opts.rpc.spec.headers ??= [];
        opts.rpc.spec.headers = opts.rpc.spec.headers.filter(x => x[0].toLowerCase() !== 'authorization');
        opts.rpc.spec.headers.push(['authorization', 'Bearer '+opts.apiCredential.secret.accessToken]);
        break secLoop;
      } break;
      default: throw new Error(`TODO: openapi sec type ${secDef.type}`);
    }
  }

  // if (apiEntity.spec.crossOriginResourceSharing === 'restricted') {
  //   // TODO: some sort of security model between browser and relay
  //   const resp = await meteorCallAsync<FetchResponseEntity>('poc-FetchRequestEntity', {
  //     ...rpc,
  //     spec: {
  //       ...rpc.spec,
  //       url: 'dist-app:/protocolendpoints/openapi/proxy/https/'+realUrl.replace(/^[^:]+:\/\//, ''),
  //     },
  //   });
  //   console.log('IframeHost server fetch result:', resp);
  //   return resp;
  // }

  const t0 = new Date;
  const realResp = await fetch(realUrl, {
    method: opts.rpc.spec.method,
    headers: opts.rpc.spec.headers,
    body: opts.rpc.spec.body ?? undefined,
    redirect: 'manual',
  });
  const firstByte = Date.now() - t0.valueOf();
  const respBody = new Uint8Array(await realResp.arrayBuffer())
  const lastByte = Date.now() - t0.valueOf();

  let body: Uint8Array | string | null = respBody;
  if (body.byteLength == 0) {
    body = null;
  } else if (realResp.headers.get('content-type')?.startsWith('text/') && body.length < (1*1024*1024)) {
    body = new TextDecoder().decode(body);
    if (body[0] == '{' || body[0] == '[') body = JSON.parse(body);
  }

  console.log('HttpCall', realResp.status, opts.rpc.spec.method, realUrl);

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

function isReferenceObject(ref: unknown): ref is OpenAPIV3.ReferenceObject {
  if (!ref || typeof ref !== 'object') return false;
  const refObj = ref as Record<string,unknown>;
  return typeof refObj.$ref == 'string';
}
