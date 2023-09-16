import React from 'react';

import { CommandEntity } from '/imports/entities/runtime';
import { SimpleGlyphIcon } from '../widgets/SimpleGlyphIcon';

export const SendAction = (props: {
  // runtime: EntityEngine;
  // apiBinding: ApiBindingEntity;
  // hWorkspace: EntityHandle<WorkspaceEntity>;
  command: CommandEntity;
  // cmdFrame: FrameEntity;
}) => {
  if (props.command.spec.type !== 'launch-intent') throw new Error(`not a launch-intent command`);
  const intent = props.command.spec.intent;

  const extras = intent.extras as {
    title?: string;
    text?: string;
    url?: string;
  };

  return (
    <nav className="activity-contents-wrap" style={{
      padding: '1em',
    }}>
      <div style={{
        backgroundColor: 'rgba(127, 127, 127, .2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25em',
        borderRadius: '5px',
        padding: '0.5em',
      }}>
        {extras?.title ? (
          <h3 title={extras.title} style={{
            margin: 0,
            textOverflow: 'ellipsis',
            textWrap: 'nowrap',
            overflowX: 'hidden',
          }}>{extras.title}</h3>
        ) : []}
        {extras?.url ? (
          <span title={extras.url} style={{
            textOverflow: 'ellipsis',
            textWrap: 'nowrap',
            overflowX: 'hidden',
            color: '#666',
          }}>{extras.url}</span>
        ) : []}
        {extras?.text ? (
          <p style={{
            margin: 0,
            textOverflow: 'ellipsis',
            textWrap: 'nowrap',
            overflowX: 'hidden',
            fontSize: extras.text.length < 20 ? '1.3em' : '1em',
          }}>{extras.text}</p>
        ) : []}
      </div>

      <div className="launcher-window wide-items" style={{padding: '1em 0 0 0'}}>

        {extras.text ? (
          <button className="launcher-button" onClick={() =>
              navigator.clipboard.writeText(extras.text)
            }>
            <SimpleGlyphIcon text='📋' backgroundColor='rgba(127, 127, 250, .5)' />
            <span className="appTitle">Copy Text</span>
            <span className="appDesc">Put the text on your computer's clipboard.</span>
          </button>
        ) : []}

        {extras.url ? (
          <a href={extras.url} target="_blank" className="launcher-button">
            <SimpleGlyphIcon text='🔗' backgroundColor='rgba(200, 157, 107, .5)' />
            <span className="appTitle">Open URL</span>
            <span className="appDesc">Open the link in a new browser tab.</span>
          </a>
        ) : []}

        {/* {extras.url ? (
          <a href={extras.url} target="_blank" className="launcher-button">
            <SimpleGlyphIcon text='📑' backgroundColor='rgba(127, 127, 127, .5)' />
            <span className="appTitle">Bookmark</span>
            <span className="appDesc">Store the link in your profile for future reference.</span>
          </a>
        ) : []} */}

      </div>

    </nav>
  );
}
