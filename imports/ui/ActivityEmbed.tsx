import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityEntity, IframeImplementationSpec } from '../entities/manifest';
import { html } from 'common-tags';
import { MessageHost } from '../runtime/MessageHost';
import { RuntimeContext } from './contexts';
import { TaskEntity } from '../entities/runtime';
import { iframeEntrypointText } from '../userland/iframe-entrypoint-blob';
import { meteorCallAsync } from '../lib/meteor-call';
import { useObjectURL } from '../lib/use-object-url';

export const ActivityEmbed = (props: {
  task: TaskEntity;
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
    messageHost.addRpcListener('reportReady', () => {
      props.onLifecycle('ready');
    });
    messageHost.addRpcListener('recycle-frame', () => {
      setIframeKey(Math.random());
    });
    messageHost.addRpcListener('launchIntent', ({rpc}) => {
      console.log('handling', rpc);
      shell.runTaskCommand(props.task, props.activity, {
        type: 'launch-intent',
        intent: {
          activityRef: (rpc as any).intent?.activity?.name as string | undefined,
          action: (rpc as any).intent?.action as string ?? 'launch',
        },
      });
    });
    messageHost.addRpcListener('fetch', async ({rpc, respondWith}) => {
      console.log('ActivityEmbed fetch', rpc);

      // TODO BEGIN
      // TODO: catch any errors and send those to the application
      const resp = await meteorCallAsync('poc-http-fetch', rpc.spec)
        .then(x => ({data: x}), err => ({error: err.stack}));
      console.log('ActivityEmbed fetch result:', resp);
      // TODO END

      respondWith(resp as any);
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
