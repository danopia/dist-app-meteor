import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ActivityEntity, IframeImplementationSpec } from '../entities/manifest';
import { RuntimeContext } from './contexts';
import { ActivityTaskEntity, FrameEntity, WorkspaceEntity } from '../entities/runtime';
import { useObjectURL } from '../lib/use-object-url';
import { FetchRpcHandler } from '../runtime/FetchRpcHandler';
import { compileIframeSrc } from '../lib/compile-iframe-src';
import { EntityHandle } from '../engine/EntityHandle';
import { ApiView } from '../portable/ApiView';
import { AttributeMap, WindowMap } from '../portable/MessagePortServer';
import { runTaskCommand } from '../runtime/workspace-actions';
import { ProtocolRpcHandler } from '../portable/ProtocolRpcHandler';

// TODO: rename AppWindow or IframeWindow, put in frames/
export const IframeHost = (props: {
  task: FrameEntity;
  // workspaceName: string;
  hWorkspace: EntityHandle<WorkspaceEntity>;
  activityTask: ActivityTaskEntity;
  activity: ActivityEntity;
  className?: string;
  onLifecycle: (lifecycle: 'loading' | 'connecting' | 'ready' | 'finished') => void;
}) => {
  const { implementation } = props.activity.spec;
  if (implementation.type != 'iframe') throw new Error(`TODO: non-iframe activities`);

  const [contentWindow, setContentWindow] = useState<Window | null>(null);
  const [iframeKey, setIframeKey] = useState(() => Math.random());

  useEffect(() => {
    props.onLifecycle('loading');
  }, []);

  const runtime = useContext(RuntimeContext);

  const fetchHandler = useMemo(() => new FetchRpcHandler(runtime, props.activityTask, props.activity, props.hWorkspace), [runtime, props.activityTask, props.activity, props.hWorkspace]);

  const [apiView] = useState(() => {
    const view = new ApiView();
    view.apiVersionImpls.set('protocol.dist.app/v1alpha2', new ProtocolRpcHandler(
      setIframeKey,
      props.onLifecycle,
      launchIntent => runTaskCommand(props.hWorkspace, props.task, props.activityTask, {
        type: 'launch-intent',
        intent: launchIntent.spec,
      }),
      fetchHandler,
    ));
    return view;
  });
  useMemo(() => {
    console.log('resetting iframe');
    setIframeKey(Math.random());
  }, [apiView]);

  useEffect(() => {
    if (contentWindow) {
      //@ts-expect-error TODO undocumented field
      if (props.activity.spec.implementation.disableCommunication) {
        props.onLifecycle('ready');
        console.log('WARN: Disabling communication with activity');
      } else {
        props.onLifecycle('connecting');
      }
    }
  }, [contentWindow, props.onLifecycle]);

  const frameSrc = useMemo(() => compileIframeSrc(implementation), [JSON.stringify(implementation)]);
  const frameBlob = useMemo(() => new Blob([frameSrc], {
    type: 'text/html; encoding=utf-8',
  }), [frameSrc]);

  const frameUrl = useObjectURL(frameBlob);
  useEffect(() => frameUrl.setObject(frameBlob), [frameBlob]);

  const onLoad = useCallback((evt: SyntheticEvent<HTMLIFrameElement, Event>) => {
    const {contentWindow} = evt.currentTarget;
    if (contentWindow) {
      WindowMap.set(contentWindow, apiView);
      AttributeMap.set(contentWindow, {
        'distapp.frame.uid': `${props.task.metadata.uid}`,
        'distapp.frame.name': props.task.metadata.name,
        'resource.name': props.task.metadata.name,
      });
    }
    setContentWindow(contentWindow);
  }, [setContentWindow, apiView]);

  if (implementation.source.type == 'internet-url') {
    const parsed = new URL(implementation.source.url);
    if (parsed.protocol !== 'https:') throw new Error(`Only HTTPS allowed`);
    return (
      <iframe key={iframeKey}
          className={props.className}
          src={implementation.source.url}
          sandbox={implementation.sandboxing?.join(' ') ?? ""}
          // CSP is to be provided by the server
          onLoad={onLoad}
        />
    );
  }

  if (!frameUrl.objectURL) return (
    <div className={props.className}>waiting for objectURL</div>
  );
  return (
    <iframe key={iframeKey}
        className={props.className}
        src={frameUrl.objectURL}
        sandbox={implementation.sandboxing?.join(' ') ?? ""}
        csp={buildCsp(implementation)}
        onLoad={onLoad}
      />
  );
};

function buildCsp(impl: IframeImplementationSpec) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${(impl.securityPolicy?.scriptSrc ?? []).join(' ')}`,
    `style-src 'self' 'unsafe-inline'`,
    ...(impl.securityPolicy?.connectSrc?.length ? [
      `connect-src 'self' ${impl.securityPolicy.connectSrc.join(' ')}`,
    ] : []),
    ...(impl.securityPolicy?.imgSrc?.length ? [
      `img-src 'self' ${impl.securityPolicy.imgSrc.join(' ')}`,
    ] : []),
  ].join('; ');
}
