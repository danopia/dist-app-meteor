import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useCallback } from 'react';
import GoogleButton from 'react-google-button';

import { CommandEntity, FrameEntity, WorkspaceEntity } from '/imports/entities/runtime';
import { deleteFrame } from '/imports/runtime/workspace-actions';
import { EntityHandle } from '/imports/engine/EntityHandle';

export const AddPlatformAccountIntent = (props: {
  hWorkspace: EntityHandle<WorkspaceEntity>;
  command: CommandEntity;
  cmdFrame: FrameEntity;
}) => {

  const user = useTracker(() => Meteor.user() ?? (Meteor.loggingIn() ? 'waiting' : false), []);
  if (user) return (
    <div className="activity-contents-wrap" style={{padding: '0 1em 2em'}}>
      <h2>Add Platform Account</h2>
      <p>You are already logged in to <strong>{new URL(Meteor.absoluteUrl()).origin}</strong>!</p>
    </div>
  );

  const startLogin = useCallback((loginFunc: typeof Meteor.loginWithGoogle) => {
    loginFunc({}, (err) => {
      if (err) {
        alert(err.message ?? err);
      } else {
        // TODO: this cleanup shall be done by deleteFrame
        // runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
        props.hWorkspace.getNeighborHandle<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', props.command.metadata.name);
        deleteFrame(props.hWorkspace, props.cmdFrame.metadata.name);

        // navigate('/my/new-shell');
      }
    });
  }, [props.hWorkspace, props.command, props.cmdFrame]);

  return (
    <div className="activity-contents-wrap" style={{padding: '0 1em 2em'}}>
      <h2>Add Platform Account</h2>
      <p>By signing in, your data will be stored on <strong>{new URL(Meteor.absoluteUrl()).origin}</strong>. You will then be able to keep your sessions around for later.</p>
      <div style={{ textAlign: 'center' }}>
        <GoogleButton style={{ display:'inline-block' }} disabled={!!user}
          onClick={() => startLogin(Meteor.loginWithGoogle)} />
      </div>
    </div>
  );
}
