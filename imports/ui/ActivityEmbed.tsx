import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { html } from 'common-tags';
import { parse } from 'yaml';
import { OpenAPIV3 } from "openapi-types";

import { ActivityEntity, ApiEntity, IframeImplementationSpec } from '../entities/manifest';
import { MessageHost } from '../runtime/MessageHost';
import { RuntimeContext } from './contexts';
import { ActivityInstanceEntity, TaskEntity } from '../entities/runtime';
import { iframeEntrypointText } from '../userland/iframe-entrypoint-blob';
import { meteorCallAsync } from '../lib/meteor-call';
import { useObjectURL } from '../lib/use-object-url';
import { FetchErrorEntity, FetchRequestEntity, FetchResponseEntity, LaunchIntentEntity, LifecycleEntity } from '../entities/protocol';

export const ActivityEmbed = (props: {
  task: TaskEntity;
  activityInstance: ActivityInstanceEntity;
  activity: ActivityEntity;
  className?: string;
  onLifecycle: (lifecycle: 'loading' | 'connecting' | 'ready' | 'finished') => void;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentWindow, setContentWindow] = useState<Window | null>(null);
  const [iframeKey, setIframeKey] = useState(() => Math.random());

  useEffect(() => {
    props.onLifecycle('loading');
  }, []);

  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'default', 'main')
  if (!shell) throw new Error(`no shell`);

  const messageHost = useMemo(() => new MessageHost(), [contentWindow, props.activity.spec.implementation]);
  useEffect(() => {
    if (contentWindow) {
      console.log('Initiating connection to iframe content');
      messageHost.connectTo(contentWindow);
      props.onLifecycle('connecting');
    }
  }, [contentWindow]);
  useEffect(() => {
    messageHost.addRpcListener<LifecycleEntity>('Lifecycle', ({rpc}) => {
      if (rpc.spec.stage == 'recycle') {
        setIframeKey(Math.random());
      } else {
        props.onLifecycle(rpc.spec.stage);
      }
    });
    messageHost.addRpcListener<LaunchIntentEntity>('LaunchIntent', ({rpc}) => {
      console.log('handling', rpc);
      shell.runTaskCommand(props.task, props.activity, {
        type: 'launch-intent',
        intent: {
          activityRef: rpc.spec.activity?.name,
          action: rpc.spec.action ?? 'launch',
        },
      });
    });
    messageHost.addRpcListener<FetchRequestEntity>('FetchRequest', async ({rpc, respondWith}) => {
      console.log('ActivityEmbed fetch', rpc);
      if (rpc.spec.bodyStream != null) throw new Error(`TODO: stream`);

      if (rpc.spec.url.startsWith('/task/state/')) {
        const stateKey = decodeURIComponent(rpc.spec.url.split('/')[2]);
        // console.log('task/state', {method: rpc.spec.method, stateKey, data: rpc.spec.body});
        if (rpc.spec.method == 'GET') {
          const {appState} = runtime.getEntity<ActivityInstanceEntity>('runtime.dist.app/v1alpha1', 'ActivityInstance', props.activityInstance.metadata.namespace, props.activityInstance.metadata.name)?.spec ?? {};
          if (appState?.[stateKey] != null) return respondWith<FetchResponseEntity>({
            kind: 'FetchResponse',
            spec: {
              status: 200,
              body: appState[stateKey],
              headers: [['content-type', 'text/plain']],
            },
          });
          return respondWith<FetchResponseEntity>({
            kind: 'FetchResponse',
            spec: {
              status: 404,
              body: `no state exists here yet (TODO)`,
              headers: [['content-type', 'text/plain']],
            },
          });
        }
        const newBody = typeof rpc.spec.body == 'string' ? rpc.spec.body : new TextDecoder().decode(rpc.spec.body);
        runtime.mutateEntity<ActivityInstanceEntity>('runtime.dist.app/v1alpha1', 'ActivityInstance', props.activityInstance.metadata.namespace, props.activityInstance.metadata.name, actInst => {
          actInst.spec.appState ??= {};
          actInst.spec.appState[stateKey] = newBody;
        });
        return respondWith<FetchResponseEntity>({
          kind: 'FetchResponse',
          spec: {
            status: 200,
            body: `ok`,
            headers: [['content-type', 'text/plain']],
          },
        });
      }

      if (rpc.spec.url.startsWith('/binding/')) {
        const slashIdx = rpc.spec.url.indexOf('/', '/binding/'.length);
        const bindingName = rpc.spec.url.slice('/binding'.length, slashIdx);
        const subPath = rpc.spec.url.slice(slashIdx+1);

        const binding = props.activity.spec.fetchBindings?.find(x => x.pathPrefix == bindingName);
        if (!binding) return respondWith<FetchResponseEntity>({
          kind: 'FetchResponse',
          spec: {
            status: 404,
            body: `No binding ${JSON.stringify(bindingName)} exists`,
            headers: [['content-type', 'text/plain']],
          },
        });
        const apiEntity = runtime.getEntity<ApiEntity>('manifest.dist.app/v1alpha1', 'Api', props.activity.metadata.namespace, binding.apiName);
        if (!apiEntity) return respondWith<FetchResponseEntity>({
          kind: 'FetchResponse',
          spec: {
            status: 404,
            body: `Binding ${JSON.stringify(bindingName)} lacks extant Api entity`,
            headers: [['content-type', 'text/plain']],
          },
        });
        const apiSpec: OpenAPIV3.Document = parse(apiEntity.spec.definition);
        const server = apiSpec.servers?.[0];
        if (!server || !server.url.startsWith('https://')) return respondWith<FetchResponseEntity>({
          kind: 'FetchResponse',
          spec: {
            status: 404,
            body: `Binding ${JSON.stringify(bindingName)} has no server available`,
            headers: [['content-type', 'text/plain']],
          },
        });

        const realUrl = new URL(subPath, server.url).toString();
        if (!realUrl.startsWith(server.url)) throw new Error(`url breakout attempt?`);

        const pathConfig = Object.entries(apiSpec.paths).filter(x => {
          const patStr = x[0].replace(/\{([^{}]+)\}/g, y => `:${y.slice(1,-1)}`);
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
          }).catch<FetchErrorEntity>(err => ({kind: 'FetchError', origId: -1, spec: {message: err.message}}));
          return respondWith(resp);
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

        return respondWith<FetchResponseEntity>({
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
        });
      }

      // TODO BEGIN
      const resp = await meteorCallAsync<FetchResponseEntity>('poc-FetchRequestEntity', rpc)
        .catch<FetchErrorEntity>(err => ({kind: 'FetchError', origId: -1, spec: {message: err.message}}));
      console.log('ActivityEmbed fetch result:', resp);
      // TODO END

      respondWith(resp);
    });
  }, [messageHost]);

  const { implementation } = props.activity.spec;
  if (implementation.type != 'iframe') throw new Error(`TODO: non-iframe activities`);

  const frameSrc = useMemo(() => compileFrameSrc(implementation), [JSON.stringify(implementation)]);
  const frameBlob = useMemo(() => new Blob([frameSrc], {
    type: 'text/html; encoding=utf-8',
  }), [frameSrc]);

  const frameUrl = useObjectURL(frameBlob);
  useEffect(() => frameUrl.setObject(frameBlob), [frameBlob]);

  if (!frameUrl.objectURL) return (
    <div className={props.className}></div>
  );
  return (
    <iframe ref={iframeRef} key={iframeKey}
        className={props.className}
        src={frameUrl.objectURL}
        sandbox={implementation.sandboxing?.join(' ') ?? ""}
        /* @ts-expect-error: csp is not typed */
        csp={[
          `default-src 'self'`,
          `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${(implementation.securityPolicy?.scriptSrc ?? []).join(' ')}`,
          `style-src 'self' 'unsafe-inline'`,
          `connect-src 'self' ${(implementation.securityPolicy?.connectSrc ?? []).join(' ')}`,
        ].join('; ')}
        onLoad={evt => {
          setContentWindow(evt.currentTarget.contentWindow);
        }}
      />
  );

  throw new Error(`TODO: unimpl`);
};

function compileFrameSrc(implementation: IframeImplementationSpec): string {
  if (implementation.source.type == 'internet-url') {
    const parsed = new URL(implementation.source.url);
    if (parsed.protocol !== 'https:') throw new Error(`Only HTTPS allowed`);
    return implementation.source.url;
  }
  if (implementation.source.type == 'piecemeal') {
    const docHtml = [
      `<!doctype html>`,
      ...(implementation.source.htmlLang ? [
        html`<html lang="${implementation.source.htmlLang}">`,
      ] : []),
      ...(implementation.source.metaCharset ? [
        html`<meta charset="${implementation.source.metaCharset}" />`,
      ] : []),
      html`<title>${implementation.source.headTitle ?? 'Embedded dist.app'}</title>`,
      ...(implementation.source.inlineStyle ? [
        `  <style type="text/css">`,
        implementation.source.inlineStyle,
        `  </style>`,
      ] : []),
      ...(implementation.source.scriptUrls?.flatMap(url => [
        html`<script src="${url}"></script>`,
      ]) ?? []),
      `<script type="module">${iframeEntrypointText.replace('{ORIGIN}', JSON.stringify(location.origin).slice(1, -1))}</script>`,
      ...(implementation.source.inlineScript ? [
        `  <script type="module" defer>`,
        implementation.source.inlineScript.replace(/^/gm, '    '),
        `  </script>`,
      ] : []),
      `<body>`,
      (implementation.source.bodyHtml ? [
        implementation.source.bodyHtml.replace(/^/gm, '  '),
      ] : []),
      `</body>`,
    ].join('\n');
    return docHtml;
  }
  throw new Error('Function not implemented.');
}


function isReferenceObject(ref: unknown): ref is OpenAPIV3.ReferenceObject {
  if (!ref || typeof ref !== 'object') return false;
  const refObj = ref as Record<string,unknown>;
  return typeof refObj.$ref == 'string';
}
