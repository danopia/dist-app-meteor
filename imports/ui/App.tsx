import React, { useEffect } from 'react';
import { navigate, useRedirect, useRoutes } from 'raviger';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

import { ActivityShell } from './ActivityShell';
import { RuntimeProvider } from './RuntimeProvider';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { meteorCallAsync } from '../lib/meteor-call';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Reset page</button>
  </div>
);

const routes = {
  '/guest-shell': () => <ActivityShell />,
  '/my/new-shell': () => <NewShell />,
};

export const App = () => {
  useRedirect('/', '/guest-shell');
  const route = useRoutes(routes) || (
    <section>
      <h2>Page Not Found</h2>
      <p>
        Like, I didn&apos;t know what you were looking for. No route matched the URL.
        Check the link that sent you here.
      </p>
    </section>
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <RuntimeProvider>
        {route}
      </RuntimeProvider>
    </ErrorBoundary>
  );
};

const NewShell = () => {
  const user = useTracker(() => Meteor.user());
  console.log('new shell for', user);

  useEffect(() => { (async () => {
    const workspaceId = await meteorCallAsync('/v1alpha1/create user workspace');
    navigate('/workspace/'+workspaceId);
  })() }, []);

  return (
    <h2>redirecting...</h2>
  );
}
