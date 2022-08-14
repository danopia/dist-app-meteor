import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityEntity, IframeImplementationSpec } from '../api/entities';
import { html } from 'common-tags';
import { MessageHost } from '../runtime/MessageHost';

export const ActivityEmbed = (props: {
  activity: ActivityEntity,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const messageHost = useMemo(() => new MessageHost(), []);
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", () => {
        if (iframe.contentWindow) {
          console.log('Initiating connection to iframe content');
          messageHost.connectTo(iframe.contentWindow);
        }
      });
    }
  }, [iframeRef]);

  const { implementation } = props.activity.spec;

  if (implementation.type == 'iframe') return (
    <iframe ref={iframeRef} className="activity-contents-wrap" src={compileFrameSrc(implementation)} sandbox={implementation.sandboxing?.join(' ') ?? ""} csp="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com" />
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
        html`<html lang="${implementation.source.htmlLang ?? 'en'}">`,
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
    return `data:text/html;base64,${btoa(docHtml)}`;
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
  static async connect() {
    const port = await new Promise((ok, reject) => {
      function handleEvent() {
        if (event.origin !== ${JSON.stringify(location.origin)}) return;
        if (typeof event.data !== 'object' || !event.data) return;
        if (typeof event.data.protocol !== 'string') return;

        window.removeEventListener("message", handleEvent);
        if (event.data.protocol !== 'dist.app/v1alpha1') reject(
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
