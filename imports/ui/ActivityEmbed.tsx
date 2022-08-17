import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityEntity, IframeImplementationSpec } from '../entities/manifest';
import { html } from 'common-tags';
import { MessageHost } from '../runtime/MessageHost';
import { RuntimeContext } from './context';
import { TaskEntity } from '../entities/runtime';

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
  const messageHost = useMemo(() => new MessageHost(), [contentWindow]);
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
    messageHost.addRpcListener('launchIntent', rpc => {
      console.log('handling', rpc);
      runtime?.runTaskCommand(props.task, props.activity, {
        type: 'launch-intent',
        intent: {
          activityRef: (rpc as any).intent?.activity?.name as string | undefined,
          action: (rpc as any).intent?.action as string ?? 'launch',
        },
      });
    });
  }, [messageHost]);

  const { implementation } = props.activity.spec;
  if (implementation.type == 'iframe') return (
    <iframe ref={iframeRef} key={iframeKey}
        className={props.className}
        src={compileFrameSrc(implementation)}
        sandbox={implementation.sandboxing?.join(' ') ?? ""}
        /* @ts-expect-error: csp is not typed */
        csp={[
          `default-src 'self'`,
          `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com https://widget.time.is`,
          `style-src 'self' 'unsafe-inline'`
        ].join('; ')}
        onLoad={evt => {
          // console.log('onLoad', evt.currentTarget.contentWindow);
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
      ...(implementation.source.scriptUrls?.flatMap(url => [
        html`<script src="${url}"></script>`,
      ]) ?? []),
      `<script>${embedInnerScript}</script>`,
      `<body>`,
      (implementation.source.bodyHtml ? [
        implementation.source.bodyHtml.replace(/^/gm, '  '),
      ] : []),
      ...(implementation.source.inlineScript ? [
        `  <script type="module">`,
        implementation.source.inlineScript.replace(/^/gm, '    '),
        `  </script>`,
      ] : []),
      `</body>`,
    ].join('\n');
    return `data:text/html;base64,${btoa(toBinary(docHtml))}`;
  }
  throw new Error('Function not implemented.');
}

const embedInnerScript = `
const originalFetch = globalThis.fetch;
globalThis.fetch = () => Promise.reject('TODO: fetch during bootstrap');
globalThis.DistApp = class DistApp {
  constructor(port) {
    this.port = port;
    port.addEventListener("message", evt => this.handleMessage(evt));
  }
  handleMessage(evt) {
    console.log('host got:', evt.data);
  }
  useVueState(key, initial) {
    console.log("TODO: useVueState", key, initial);
    return initial;
  }
  reportReady() {
    this.port.postMessage({rpc: 'reportReady'})
  }
  sendRpc(data) {
    this.port.postMessage(data);
  }
  static async connect() {
    const port = await new Promise((ok, reject) => {
      function handleEvent() {
        if (event.origin !== ${JSON.stringify(location.origin)}) return;
        if (typeof event.data !== 'object' || !event.data) return;
        if (typeof event.data.protocol !== 'string') return;

        window.removeEventListener("message", handleEvent);
        window.addEventListener("message", () => {
          console.error("Received a second protocol initiation?? Reloading");
          try {
            event.ports?.map(port => port.postMessage({
              rpc: 'recycle-frame',
            })) ?? [];
            if (port) reject(
              new Error("Received protocol packet without a port"));
            ok(port);
          } finally {
            window.location.reload();
          }
        });

        if (event.data.protocol !== 'protocol.dist.app/v1alpha1') reject(
          new Error("Received unexpected protocol "+event.data.protocol));
        const [port] = event.ports ?? [];
        if (!port) reject(
          new Error("Received protocol packet without a port"));
        ok(port);
      }
      window.addEventListener("message", handleEvent);
    }, false);
    return new DistApp(port);
  }
}`;

function toBinary(string: string) {
  const charCodes = new TextEncoder().encode(string);
  let result = '';
  for (let i = 0; i < charCodes.byteLength; i++) {
    result += String.fromCharCode(charCodes[i]);
  }
  return result;
}
