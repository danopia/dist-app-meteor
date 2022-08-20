import React from 'react';
import { useRoutes } from 'raviger';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

import { ActivityShell } from './ActivityShell';
import { RuntimeProvider } from './RuntimeProvider';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Reset page</button>
  </div>
);

const routes = {
  '/shell': () => <ActivityShell />,
};

export const App = () => {
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
