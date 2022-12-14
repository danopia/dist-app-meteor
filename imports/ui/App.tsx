import React, { useEffect } from 'react';
import { navigate, useRedirect, useRoutes } from 'raviger';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

import { ActivityShell } from './ActivityShell';
import { RuntimeProvider } from './RuntimeProvider';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { meteorCallAsync } from '../lib/meteor-call';
import { ErrorFallback } from '../lib/error-fallback';
// import { ShellSelector } from './ShellSelector';

const routes = {
  // '/desktop': () => <ShellSelector />,
  '/desktop/guest': () => <ActivityShell guest={true} />,
  // '/my/new-shell': () => <NewShell />,
  '/desktop/saved-session/:savedSessionName': (params: {
    // profileId?: string;
    savedSessionName: string;
    // workspaceName: string;
  }) => <ActivityShell savedSessionName={params.savedSessionName} guest={false} />,
};

export const App = () => {
  useRedirect('/', '/desktop/guest', {replace: true});
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

// const NewShell = () => {
//   const user = useTracker(() => Meteor.user());
//   console.log('new shell for', user);

//   // Redirect based on server call
//   useEffect(() => { (async () => {
//     const {profileId, workspaceName} = await meteorCallAsync<{
//       profileId: string;
//       workspaceName: string;
//     }>('/v1alpha1/create user workspace');
//     navigate(`/~${profileId}/workspace/${workspaceName}`, {
//       replace: true,
//     });
//   })() }, []);

//   return (
//     <h2>redirecting...</h2>
//   );
// }
