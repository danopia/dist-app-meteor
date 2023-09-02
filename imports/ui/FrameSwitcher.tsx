import React, { useContext } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { useNavigate } from "raviger";

import { FrameEntity } from "../entities/runtime";
import { RuntimeContext } from "./contexts";

export const FrameSwitcher = (props: {
  workspaceName: string;
  profileId?: string;
}) => {

  const navigate = useNavigate();

  const runtime = useContext(RuntimeContext);

  // TODO: please let this techdebt die
  const shell = runtime.loadEntity('runtime.dist.app/v1alpha1', 'Workspace', 'session', props.workspaceName);

  const frames = useTracker(() => runtime
    .listEntities<FrameEntity>(
      'runtime.dist.app/v1alpha1', 'Frame',
      'session',
    )
    .filter(x => x.metadata.ownerReferences?.some(y => y.name == props.workspaceName))
  , [runtime, props.workspaceName]);

  return (<>
    {frames.map(frame => (
      <div className="one-tab" key={frame.metadata.name}>
        <button className="main" type="button" onClick={() => {
          if (props.profileId) {
            navigate(`/profile/${props.profileId}/workspace/${props.workspaceName}`);
          }
          shell?.runTaskCommand(frame, null, {
            type: 'bring-to-top',
          });
        }}>{frame.metadata?.title ?? frame.metadata.name}</button>
        <button className="action" type="button" onClick={() => {
          shell?.runTaskCommand(frame, null, {
            type: 'delete-task',
          });
        }}>x</button>
      </div>
    ))}
  </>);
}
