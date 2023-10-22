import React from 'react';
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { ErrorFallback } from '/imports/lib/error-fallback';
import { ErrorBoundary } from 'react-error-boundary';
import { MyCommandPalette } from '../CommandPalette';
import { WorkspaceEntity } from '/imports/entities/runtime';
import { EntityHandle } from '/imports/engine/EntityHandle';

export const CommandPanel = (props: {
  hWorkspace?: EntityHandle<WorkspaceEntity>;
}) => {
  const {hWorkspace} = props;
  const workspace = useTracker(() => hWorkspace?.get(), [hWorkspace]);

  return (<>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyCommandPalette parentElement=".activity-shell-parent" hWorkspace={props.hWorkspace} />
    </ErrorBoundary>
    {hWorkspace ? (<>
      <select onChange={(evt) => hWorkspace.mutate(x => {
          x.spec.frameMode = evt.currentTarget.value as 'windowing' | 'tabbed';
        })} defaultValue={workspace?.spec.frameMode ?? 'windowing'}>
        <option value="windowing">windowing</option>
        <option value="tabbed">tabbed</option>
      </select>
      <button onClick={() => hWorkspace.mutate(x => {
          x.spec.layerRenderKey = `${Math.random()}`;
        })}>Recreate windows</button>
    </>) : []}
  </>);
}
