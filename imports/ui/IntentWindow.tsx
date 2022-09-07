import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { navigate } from "raviger";
import React, { ReactNode, useCallback, useContext, useState } from "react";
import GoogleButton from 'react-google-button';

import { ActivityEntity, ApplicationEntity } from "../entities/manifest";
import { LaunchIntentEntity } from "../entities/protocol";
import { CommandEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";
import { WindowFrame } from "./widgets/WindowFrame";

export const IntentWindow = (props: {
  cmdName: string;
  intent: LaunchIntentEntity['spec'],
}) => {
  const runtime = useContext(RuntimeContext);
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'default', 'main')
  if (!shell) throw new Error(`no shell`);

  const [floatingRect, setFloatingRect] = useState<{
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  }>({left: 100, top: 100, width: 500});

  const apis = useTracker(() => runtime.getNamespacesServingApi({
    apiVersion: 'manifest.dist.app/v1alpha1',
    kind: 'Activity',
    op: 'Read',
  }));

  const activities = useTracker(() => Array
    .from(apis.values())
    .flatMap(x => x
      .listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity'))) ?? [];

  let children: ReactNode;
  const [lifecycle, setLifecycle] = useState('initial');

  //@ts-expect-error URLPattern
  if (props.intent.action == 'app.dist.View' && props.intent.catagory == 'app.dist.Browsable' && props.intent.data && new URLPattern({protocol: 'https:'}).test(props.intent.data)) {
    children = (
      <nav className="activity-contents-wrap launcher-window">
        <h2>Open Web URL</h2>
        <a href={props.intent.data} target="_blank" onClick={() => {
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'default', props.cmdName);
        }}>
          Open {props.intent.data}
        </a>
      </nav>
    );
  }

  //@ts-expect-error extras is untyped
  if (props.intent.action == 'settings.AddAccount' && props.intent.extras.AccountTypes?.includes('v1alpha1.platform.dist.app')) {
    const startLogin = (loginFunc: typeof Meteor.loginWithGoogle) => {
      setLifecycle('loading');
      loginFunc({}, (err) => {
        if (err) {
          setLifecycle('initial');
          alert(err.message ?? err);
        } else {
          runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'default', props.cmdName);
          navigate('/my/new-shell');
        }
      });
    };

    children = (
      <div className="activity-contents-wrap" style={{padding: '0 1em 2em'}}>
        <h2>Add Platform Account</h2>
        <p>By signing in, your data will be stored on <strong>{new URL(Meteor.absoluteUrl()).origin}</strong>. You will then be able to keep your sessions around for later.</p>
        <div style={{ textAlign: 'center' }}>
          <GoogleButton style={{ display:'inline-block' }} disabled={lifecycle !== 'initial'}
            onClick={() => startLogin(Meteor.loginWithGoogle)} />
        </div>
      </div>
    );
  }

  children ??= (
    <nav className="activity-contents-wrap launcher-window">
      <h2>Open generic intent</h2>
      TODO
      {JSON.stringify(props.intent)}
    </nav>
  );

  return (
    <WindowFrame
        floatingRect={floatingRect}
        className="intent-frame"
        layoutMode="floating"
        resizable={true}
        sizeRules={{maxWidth: 800}}
        onMoved={xy => setFloatingRect({ ...floatingRect, left: xy.left, top: xy.top })}
        onResized={xy => setFloatingRect({ ...floatingRect, width: xy.width, height: xy.height })}
        showLoader={lifecycle == 'loading'}
        zIndex={50}
    >
      <section className="shell-powerbar">
        <div className="window-title">Handle Intent</div>
        <nav className="window-buttons">
          <button onClick={() => runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'default', props.cmdName)}>
            <svg version="1.1" height="20" viewBox="0 0 512 512">
              <path transform="scale(25.6)" d="m6.0879 4.082-2.0059 2.0059 3.9121 3.9121-3.9121 3.9102 2.0059 2.0078 3.9121-3.9121 3.9102 3.9102 2.0078-2.0059-3.9102-3.9121 3.9082-3.9102-2.0039-2.0059-3.9121 3.9121-3.9121-3.9121z" strokeWidth=".039062"/>
            </svg>
          </button>
        </nav>
      </section>
      {children}
    </WindowFrame>
  );
}
