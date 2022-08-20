import React from 'react';
import { ActivityShell } from './ActivityShell';
import { RuntimeProvider } from './RuntimeProvider';

export const App = () => (
  <RuntimeProvider>
    <ActivityShell />
  </RuntimeProvider>
);
