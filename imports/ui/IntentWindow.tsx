import { useTracker } from "meteor/react-meteor-data";
import React, { useContext } from "react";
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

  const apis = useTracker(() => runtime.getNamespacesServingApi({
    apiVersion: 'manifest.dist.app/v1alpha1',
    kind: 'Activity',
    op: 'Read',
  }));

  const activities = useTracker(() => Array
    .from(apis.values())
    .flatMap(x => x
      .listEntities<ActivityEntity>('manifest.dist.app/v1alpha1', 'Activity'))) ?? [];

  //@ts-expect-error URLPattern
  if (props.intent.action == 'app.dist.View' && props.intent.catagory == 'app.dist.Browsable' && props.intent.data && new URLPattern({protocol: 'https:'}).test(props.intent.data)) {
    console.log('browser intent', props);
    return (
      <WindowFrame
          floatingRect={{left: 200, top: 200}}
          layoutMode="floating"
          resizable={false}
          sizeRules={{maxWidth: 600}}
          onMoved={() => {}}
          onResized={() => {}}
          showLoader={false}
      >
        <section className="shell-powerbar">
          <div className="window-title">Open Webpage</div>
        </section>
        <nav className="activity-contents-wrap launcher-window">
          <a href={props.intent.data} target="_blank" onClick={() => {
            runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'default', props.cmdName);
          }}>
            Open {props.intent.data}
          </a>
        </nav>
      </WindowFrame>
    );
  }

  return (
    <WindowFrame
        floatingRect={{left: 100, top: 100}}
        layoutMode="floating"
        resizable={false}
        onMoved={() => {}}
        onResized={() => {}}
        showLoader={false}
    >
      <section className="shell-powerbar">
        <div className="window-title">Launcher</div>
      </section>
      <nav className="activity-contents-wrap launcher-window">
        TODO
      </nav>
    </WindowFrame>
  );
}
