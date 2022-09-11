import { Meteor } from 'meteor/meteor';

// Side-effect: replaces event stacks
import 'stack-source-map/register';
window.addEventListener('error', evt => {
  try {
    if (evt.error.message == `Unexpected token '<', "\n<!DOCTYPE "... is not valid JSON`) {
      return Meteor.call('/v1alpha1/report-error',
        `SyntaxError: Received HTML error page from server`);
    }
    const stack: string = evt.error.stack;
    const stackParts = stack
      .replace(/([( ])https?:[^ )]+:\/💻app\//g, x => x[0])
      .replace(/([( ])https?:[^ )]+\/packages\/[^ ):]+:\d+:\d+/g, x => x[0]+`meteor`)
      .replace(/\?hash=[0-9a-f]+:/g, x => ':');
    Meteor.call('/v1alpha1/report-error', stackParts);
  } catch (err) {
    console.error(err);
  }
});

// Side-effect: register serviceWorker
import './install-worker';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '/imports/ui/App';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  if (!container) throw new Error('Root element not found');
  const root = createRoot(container);
  root.render(<App />);
});
