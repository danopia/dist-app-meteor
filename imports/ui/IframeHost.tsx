import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { html } from 'common-tags';

import { ActivityEntity, IframeImplementationSpec } from '../entities/manifest';
import { MessageHost } from '../runtime/MessageHost';
import { RuntimeContext } from './contexts';
import { ActivityTaskEntity, FrameEntity } from '../entities/runtime';
import { iframeEntrypointText } from '../userland/iframe-entrypoint-blob';
import { useObjectURL } from '../lib/use-object-url';
import { FetchErrorEntity, FetchRequestEntity, LaunchIntentEntity, LifecycleEntity, WriteDebugEventEntity } from '../entities/protocol';
import { FetchRpcHandler } from '../runtime/FetchRpcHandler';

export const IframeHost = (props: {
  task: FrameEntity;
  workspaceName: string;
  activityTask: ActivityTaskEntity;
  activity: ActivityEntity;
  className?: string;
  onLifecycle: (lifecycle: 'loading' | 'connecting' | 'ready' | 'finished') => void;
}) => {
  const { implementation } = props.activity.spec;
  if (implementation.type != 'iframe') throw new Error(`TODO: non-iframe activities`);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentWindow, setContentWindow] = useState<Window | null>(null);
  const [iframeKey, setIframeKey] = useState(() => Math.random());

  useEffect(() => {
    props.onLifecycle('loading');
  }, []);

  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName);
  if (!shell) throw new Error(`no shell`);

  const fetchHandler = useMemo(() => new FetchRpcHandler(runtime, props.activityTask, props.activity), [runtime, props.activityTask, props.activity]);

  const messageHost = useMemo(() => new MessageHost(), [contentWindow, implementation]);
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
      console.log('handling LaunchIntent', rpc);
      shell.runTaskCommand(props.task, props.activityTask, {
        type: 'launch-intent',
        intent: rpc.spec,
      });
    });
    messageHost.addRpcListener<FetchRequestEntity>('FetchRequest', async ({rpc, respondWith}) => {
      try {
        respondWith(await fetchHandler.handle(rpc));
      } catch (err) {
        respondWith<FetchErrorEntity>({
          kind: 'FetchError',
          spec: {
            message: `dist.app fetch error: ${(err as Error).message}`,
          } });
      }
    });
    messageHost.addRpcListener<WriteDebugEventEntity>('WriteDebugEvent', ({rpc}) => {
      // TODO: record the debug events, probably in 'session' but perhaps as 'debug.dist.app' API
      console.log({ WriteDebugEvent: rpc.spec });
      if (rpc.spec.error) {
        alert('A running dist.app encountered a script error:\n\n' + rpc.spec.error.stack);
      }
    })
  }, [messageHost]);

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
