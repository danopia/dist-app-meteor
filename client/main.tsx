import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';

import { App } from '/imports/ui/App';
import './install-worker';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  if (!container) throw new Error('Root element not found');
  const root = createRoot(container);
  root.render(<App />);
});
