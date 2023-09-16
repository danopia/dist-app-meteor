import React from 'react';
import { useRoutes } from 'raviger';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from '../lib/error-fallback';
import { ViewportSwitcher } from './ViewportSwitcher';
import { LaunchPublicApp } from './routes/LaunchPublicApp';
import { WelcomeSplash } from './routes/WelcomeSplash';
import { ConfigurePage } from './routes/ConfigurePage';
import { ShareTarget } from './routes/ShareTarget';

const routes = {
  '/': () => <WelcomeSplash />,

  // TODO: different config pages
  '/configure': () => <ConfigurePage />,
  '/configure/catalogs': () => <ConfigurePage />,

  '/profile': () => <ViewportSwitcher />,
  '/profile/:profileId': (params: {
    profileId: string;
  }) => <ViewportSwitcher profileId={params.profileId} />,
  '/profile/:profileId/workspace/:workspaceName': (params: {
    profileId: string;
    workspaceName: string;
  }) => <ViewportSwitcher profileId={params.profileId} workspaceName={params.workspaceName} />,

  '/public-index/apps/:listingName/launch': (params: {
    listingName: string;
  }) => <LaunchPublicApp appListingName={params.listingName} />,

  '/share-target': () => <ShareTarget />,
};

export const App = () => {
  // useRedirect('/', '/desktop/guest', {replace: true});
  // useSubscribe('/v1alpha1/all-my-stuff');
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
      {route}
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
