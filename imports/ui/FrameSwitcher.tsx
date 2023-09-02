import React, { useContext } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { useNavigate } from "raviger";

import { FrameEntity, WorkspaceEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";
import { EntityHandle } from "../engine/EntityHandle";
import { runTaskCommand } from "../runtime/workspace-actions";

export const FrameSwitcher = (props: {
  hWorkspace: EntityHandle<WorkspaceEntity>;
  profileId?: string;
}) => {

  const navigate = useNavigate();

  const runtime = useContext(RuntimeContext);

  // TODO: please let this techdebt die
  // const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.hWorkspace.coords.name);

  const frames = useTracker(() => runtime
    .listEntities<FrameEntity>(
      'runtime.dist.app/v1alpha1', 'Frame',
      'session',
    )
    .filter(x => x.metadata.ownerReferences?.some(y => y.name == props.hWorkspace.coords.name))
  , [runtime, props.hWorkspace]);

  return (<>
    {frames.map(frame => (
      <div className="one-tab" key={frame.metadata.name}>
        <button className="main" type="button" onClick={() => {
          if (props.profileId) {
            navigate(`/profile/${props.profileId}/workspace/${props.hWorkspace.coords.name}`);
          }
          runTaskCommand(props.hWorkspace, frame, null, {
            type: 'bring-to-top',
          });
        }}>{frame.metadata?.title ?? frame.metadata.name}</button>
        <button className="action" type="button" onClick={() => {
          runTaskCommand(props.hWorkspace, frame, null, {
            type: 'delete-task',
          });
        }}>x</button>
      </div>
    ))}
  </>);
}
