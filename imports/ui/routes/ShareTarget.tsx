import React, { useEffect, useMemo, useState } from 'react';
import { useQueryParams } from 'raviger';
import { Meteor } from 'meteor/meteor';
import { useSubscribe, useTracker } from 'meteor/react-meteor-data';
import { EntityEngine } from '/imports/engine/EntityEngine';
import { WorkspaceEntity } from '/imports/entities/runtime';

import './ShareTarget.css';
import { launchNewIntent } from '/imports/runtime/workspace-actions';
import { EntityHandle } from '/imports/engine/EntityHandle';
import { useBodyClass } from '/imports/lib/use-body-class';

type ShareData = {
  title?: string;
  text?: string;
  url?: string;
}

export const ShareTarget = () => {
  const params = useQueryParams()[0] as ShareData;

  // Desktop Chrome seems to put URLs in the text field.
  // We try to move them out to the url field.
  const shareData = (params.text?.match(/^https?:\/\/[^ \r\n]+$/) && !params.url)
    ? { title: params.title, url: params.text }
    : { ...params };

  useBodyClass('fill-body');

  const user = useTracker(() => Meteor.user(), []);
  const [profileId, setProfileId] = useState<string|null>(null);
  useEffect(() => {
    if (!user) return;
    Meteor.callAsync('/v1alpha1/get user profile')
      .then(profileId => setProfileId(profileId))
      .catch(err => alert(`Share failed. ${err.message}`));
  }, [user]);

  useSubscribe('/v1alpha1/profiles/list');
  useSubscribe(profileId ? '/v1alpha1/profiles/by-id/composite' : undefined, profileId);

  // TODO: useMemo is the wrong tool for this
  const engine = useMemo(() => {
    if (!profileId) return null;
    const engine = new EntityEngine();

    engine.addNamespace({
      name: 'session',
      spec: {
        layers: [{
          mode: 'ReadWrite',
          accept: [{}],
          storage: {
            type: 'profile',
            profileId: profileId,
          },
        }],
      }});

    return engine;
  }, [profileId]);

  const workspaces = useTracker(() => engine
    ?.listEntities<WorkspaceEntity>(
      'runtime.dist.app/v1alpha1', 'Workspace', 'session')
    .map(entity => ({
      entity,
      hWorkspace: engine
        .getEntityHandle<WorkspaceEntity>(
          'runtime.dist.app/v1alpha1', 'Workspace',
          'session', entity.metadata.name),
    })), [engine]);

  return (
    <div className="share-target-wrap">
      <div className="share-target-box">
        <h3 style={{alignSelf: 'center'}}>dist.app &mdash; Share Target</h3>
        <table>
          {shareData.title ? (
            <tr>
              <th>title</th>
              <td><code>{shareData.title}</code></td>
            </tr>
          ) : []}
          {shareData.text ? (
            <tr>
              <th>text</th>
              <td><code>{shareData.text}</code></td>
            </tr>
          ) : []}
          {shareData.url ? (
            <tr>
              <th>url</th>
              <td><code>{shareData.url}</code></td>
            </tr>
          ) : []}
        </table>
        <button disabled>
          Save to profile
        </button>
        {workspaces?.length ? workspaces.map(x => (
          <SendToWorkspace hWorkspace={x.hWorkspace} workspace={x.entity} data={shareData} />
        )) : (
          <progress />
        )}
      </div>
    </div>
  );
};

const SendToWorkspace = (props: {
  workspace: WorkspaceEntity;
  hWorkspace: EntityHandle<WorkspaceEntity>;
  data: ShareData;
}) => {

  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  useEffect(() => {
    if (status == 'sending') {
      launchNewIntent(props.hWorkspace, {
        action: 'app.dist.Send',
        extras: {
          contentType: (typeof props.data.text == 'string')
            ? 'text/plain'
            : undefined,
          text: props.data.text,
          title: props.data.title,
          url: props.data.url,
        },
      }).then(() => {
        setStatus('done');
        window.close();
      });
    }
  }, [status]);

  const actionText = `Send to: ${props.workspace.metadata.title ?? props.workspace.metadata.name}`;

  return (
    <button onClick={() => setStatus('sending')} disabled={status != 'idle'}>
      {status == 'sending' ? (
        <progress />
      ) : actionText}
    </button>
  );
}
