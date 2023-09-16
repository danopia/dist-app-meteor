import React from 'react';

import { CommandEntity } from '/imports/entities/runtime';
import { AppIcon } from '../widgets/AppIcon';

export const SendAction = (props: {
  // runtime: EntityEngine;
  // apiBinding: ApiBindingEntity;
  // hWorkspace: EntityHandle<WorkspaceEntity>;
  command: CommandEntity;
  // cmdFrame: FrameEntity;
}) => {
  if (props.command.spec.type !== 'launch-intent') throw new Error(`not a launch-intent command`);
  const intent = props.command.spec.intent;

  return (
    <nav className="activity-contents-wrap" style={{
      padding: '1em',
    }}>
      <div style={{
        backgroundColor: '#eee',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25em',
        borderRadius: '5px',
        padding: '0.5em',
      }}>
        {intent.extras?.title ? (
          <h3 title={intent.extras.title} style={{
            margin: 0,
            textOverflow: 'ellipsis',
            textWrap: 'nowrap',
            overflowX: 'hidden',
          }}>{intent.extras.title}</h3>
        ) : []}
        {intent.extras?.url ? (
          <span title={intent.extras.url} style={{
            textOverflow: 'ellipsis',
            textWrap: 'nowrap',
            overflowX: 'hidden',
            color: '#666',
          }}>{intent.extras.url}</span>
        ) : []}
        {intent.extras?.text ? (
          <p style={{
            margin: 0,
            fontSize: intent.extras.text.length < 20 ? '1.3em' : '1em',
          }}>{intent.extras.text}</p>
        ) : []}
      </div>

      <div className="launcher-window wide-items" style={{padding: '1em 0 0 0'}}>

        {intent.extras.text ? (
          <button className="launcher-button" onClick={() =>
              navigator.clipboard.writeText(intent.extras.text)
            }>
            <AppIcon className="appIcon" iconSpec={{
                type: 'glyph',
                glyph: {
                  text: '📋',
                  backgroundColor: 'rgba(127, 127, 127, .5)',
                },
              }} />
            <span className="appTitle">Copy Text</span>
            <span className="appDesc">Put the text on your computer's clipboard.</span>
          </button>
        ) : []}

        {intent.extras.url ? (
          <a href={intent.extras.url} target="_blank" className="launcher-button">
            <AppIcon className="appIcon" iconSpec={{
                type: 'glyph',
                glyph: {
                  text: '🔗',
                  backgroundColor: 'rgba(127, 127, 127, .5)',
                },
              }} />
            <span className="appTitle">Open URL</span>
            <span className="appDesc">Open the link in a new browser tab.</span>
          </a>
        ) : []}

        {/* {intent.extras.url ? (
          <a href={intent.extras.url} target="_blank" className="launcher-button">
            <AppIcon className="appIcon" iconSpec={{
                type: 'glyph',
                glyph: {
                  text: '📑',
                  backgroundColor: 'rgba(127, 127, 127, .5)',
                },
              }} />
            <span className="appTitle">Bookmark</span>
            <span className="appDesc">Store the link in your profile for future reference.</span>
          </a>
        ) : []} */}

      </div>

    </nav>
  );
}
