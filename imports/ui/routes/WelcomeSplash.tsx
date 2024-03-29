import { useTracker } from 'meteor/react-meteor-data';
import React, { useMemo } from 'react';
import { Link } from 'raviger';
import { Meteor } from 'meteor/meteor';

import { EntityEngine } from '/imports/engine/EntityEngine';
import { marketUrl } from '/imports/settings';
import { AppListingEntity } from '/imports/runtime/system-apis/market';
import { ConnectionsPanel } from '/imports/ui/tray/ConnectionsPanel';
import { LogoutPanel } from '/imports/ui/tray/LogoutPanel';
import { networkIconSvg } from '/imports/svgs/network-icon';
import { BrandingPanel } from '../tray/BrandingPanel';
import { SimpleGlyphIcon } from '../widgets/SimpleGlyphIcon';
import { AppIcon } from '../widgets/AppIcon';
import { MonitoringPanel } from '../tray/MonitoringPanel';

export const WelcomeSplash = () => {

  return (
    <div className="switcher-root">
      <ul className="switcher-menu">

        <BrandingPanel brandText="dist.app" iconSpec={{
          type: 'svg',
          svg: {
            textData: networkIconSvg,
            backgroundColor: '#1155bb',
          },
        }} />

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
          {/* <FramesPanel
              hWorkspace={hWorkspace}
            /> */}

        <div style={{flex: 1}} />

        <MonitoringPanel />
        <ConnectionsPanel />
        <LogoutPanel />

      </ul>
      <div className="switcher-content activity-shell-parent splash-parent" style={{
          backgroundColor: 'gray',
        }}>

        <div className="shell-backdrop" style={{
            gridArea: '1 / 1 / 4 / 4',
            zIndex: 'initial',
          }} />

        <WelcomeSplashCard />
      </div>
    </div>
  );

};


export const WelcomeSplashCard = () => {

  const user = useTracker(() => Meteor.user(), []);

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

        <div className="launcher-window wide-items" style={{padding: 0}}>
          {appListings.length ? appListings.map(listing => (
            <Link key={listing.metadata.name} className="launcher-button" href={`public-index/apps/${listing.metadata.name}/launch`}>
              {listing.spec.icon ? (
                <AppIcon iconSpec={listing.spec.icon} />
              ) : (
                <SimpleGlyphIcon text='⏳' backgroundColor='rgba(127, 127, 127, .5)' />
              )}
              <span className="appTitle">{listing.metadata.title}</span>
              <span className="appDesc">{listing.metadata.description}</span>
            </Link>
          )) : (
            <progress style={{margin: '5em 1em'}} />
          )}
        </div>

      </div>

      <div className="profile-section" style={{marginTop: '1em'}}>
        <h2>User Area</h2>

        <div className="launcher-window wide-items" style={{padding: 0}}>
          {user ? (<>
            <Link className="launcher-button" href={`profile`}>
              <SimpleGlyphIcon text='🖥️' backgroundColor='rgba(127, 127, 127, .5)' />
              <span className="appTitle">Cloud Workspace</span>
              <span className="appDesc">Use cloud-based applications</span>
            </Link>
            <Link className="launcher-button" href={`configure`}>
              <SimpleGlyphIcon text='🔧' backgroundColor='rgba(127, 127, 127, .5)' />
              <span className="appTitle">Configure</span>
              <span className="appDesc">Set up your profile</span>
            </Link>
          </>) : (
            <button className="launcher-button" onClick={() => Meteor.loginWithGoogle()}>
              <SimpleGlyphIcon text='🔐' backgroundColor='rgba(127, 127, 127, .5)' />
              <span className="appTitle">Log in</span>
              <span className="appDesc">Authenticate to this server</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );

};
