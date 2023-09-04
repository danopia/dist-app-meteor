import { useTracker } from 'meteor/react-meteor-data';
import React, { useMemo } from 'react';

import { EntityEngine } from '/imports/engine/EntityEngine';
import { useBodyClass } from '/imports/lib/use-body-class';
import { marketUrl } from '/imports/settings';
import { AppListingEntity } from '/imports/runtime/system-apis/market';
import { AppIcon } from '../widgets/AppIcon';
import { ConnectionsPanel } from '../powerbar/ConnectionsPanel';
import { Link } from 'raviger';
import { LogoutPanel } from '../powerbar/LogoutPanel';
import { networkIconSvg } from '/imports/svgs/network-icon';

export const WelcomeSplash = () => {

  useBodyClass('fill-body');

  // useSubscribe('/v1alpha1/profiles/list');
  // const profiles = useFind(() => ProfilesCollection.find(), []);
  // const profile = profiles?.find(x => x._id == profileId) ?? profiles?.[0];
  // useSubscribe(profile && '/v1alpha1/profiles/by-id/composite', profile?._id);


  // TODO: useMemo is the wrong tool for this
  const engine = useMemo(() => new EntityEngine(), []);

  const publicIndex = useMemo(() => engine
    .useRemoteNamespace(marketUrl)
  , [engine, marketUrl]);

  const appListings = useTracker(() => engine
    .listEntities<AppListingEntity>(
      'market.dist.app/v1alpha1', 'AppListing',
      publicIndex)
    .filter(x => x
      .metadata.tags?.includes('public-utility'))
  , [engine, publicIndex]);

  return (
    <div className="switcher-root">
      <ul className="switcher-menu">
        <li className="switcher-icon" style={{justifyItems: 'center', margin: '0.5em 0'}}>
          <AppIcon className="appIcon" iconSpec={{
            type: 'svg',
            svg: {
              textData: networkIconSvg,
              backgroundColor: '#1155bb',
            },
          }} sizeRatio={4} />
          <h2 style={{fontWeight: 200, margin: '0.5em 0' }}>dist.app</h2>
        </li>
        {/* <li style={{
            display: 'grid',
          }}>
          <select style={{
              width: '100%',
            }}>
            {profiles?.map(x => (
              <option key={x._id}>
                {x.description ?? `${x._id.slice(0,4)}...`}
              </option>
            )) ?? []}
          </select>
        </li> */}
          {/* <FrameSwitcher
              hWorkspace={hWorkspace}
            /> */}

        <div style={{flex: 1}} />

        <ConnectionsPanel />
        <LogoutPanel />

      </ul>
      <div className="activity-shell-parent splash-parent" style={{
          gridColumn: '2',
          // display: 'block',
          backgroundColor: 'gray',
        }}>

        <div className="shell-backdrop" style={{
            gridArea: '1 / 1 / 4 / 4',
            zIndex: 'initial',
          }} />

        <div className="splash-modal" style={{
            gridRow: '2',
            gridColumn: '2',
            // maxWidth: '40em',
            // margin: '5em auto',
            padding: '2em 5%',
            overflowY: 'auto',
          }}>
          <h1>Welcome to a dist.app system.</h1>
          <p>
            The dist.app platform offers an experimental way of launching web-based applications.
            The principles of least-privilege, stateless programming, and single-purpose modules are combined to reduce individual application complexity.
          </p>
          <div className="public-app-section">
            <h2>Public Utilities</h2>
            <p>Try out these freely-accessible applications in one click:</p>

            <div className="launcher-window wide-items">
              {appListings.map(listing => (
                <Link key={listing.metadata.name} className="launcher-button" href={`public-index/apps/${listing.metadata.name}/launch`}>
                  <AppIcon className="appIcon" iconSpec={listing.spec.icon ?? {
                      type: 'glyph',
                      glyph: {
                        text: '⏳',
                        backgroundColor: 'rgba(127, 127, 127, .5)',
                      },
                    }} />
                  <span className="appTitle">{listing.metadata.title}</span>
                  <span className="appDesc">{listing.metadata.description}</span>
                </Link>
              ))}
            </div>

          </div>

          <div className="profile-section">
            <h2>User Area</h2>

            <div className="launcher-window wide-items">
              <Link className="launcher-button" href={`profile`}>
                <AppIcon className="appIcon" iconSpec={{
                    type: 'glyph',
                    glyph: {
                      text: '🔐',
                      backgroundColor: 'rgba(127, 127, 127, .5)',
                    },
                  }} />
                <span className="appTitle">My Workspace</span>
                <span className="appDesc">Use cloud-based applications.</span>
              </Link>
            </div>

          </div>

          {/* <h1>Hi!</h1> */}
          {/* {JSON.stringify(appListings)} */}
        </div>
      </div>
    </div>
  );

};
