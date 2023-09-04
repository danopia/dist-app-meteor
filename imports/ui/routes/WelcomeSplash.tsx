import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ActivityShell } from '../ActivityShell';
import { EntityEngine } from '/imports/engine/EntityEngine';
import { remoteConns } from '/imports/engine/EntityStorage';
import { AppInstallationEntity } from '/imports/entities/profile';
import { WorkspaceEntity } from '/imports/entities/runtime';
import { useBodyClass } from '/imports/lib/use-body-class';
import { marketUrl } from '/imports/settings';
import { RuntimeContext } from '../contexts';
import { FrameSwitcher } from '../FrameSwitcher';
import { AppListingEntity } from '/imports/runtime/system-apis/market';
import { AppIcon } from '../widgets/AppIcon';
import { launchNewIntent } from '/imports/runtime/workspace-actions';
import { EntityHandle } from '/imports/engine/EntityHandle';
import { ConnectionsPanel } from '../powerbar/ConnectionsPanel';
import { Link } from 'raviger';
import { AuthorizeApiBindingIntent } from '../intents/AuthorizeApiBindingIntent';

export const WelcomeSplash = () => {

  useBodyClass('fill-body');

  const user = useTracker(() => Meteor.user(), []);
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
        {/* <li className="switcher-icon" style={{justifyItems: 'center'}}>
          <AppIcon className="appIcon" iconSpec={appListing?.spec.icon ?? {
            type: 'glyph',
            glyph: {
              text: '⏳',
              backgroundColor: 'rgba(127, 127, 127, .5)',
            },
          }} sizeRatio={2} />
          <button className="switcher-profile-photo" style={{
              backgroundColor: 'gray',
            }} />
        </li> */}
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

        {user ? (<>
          <button style={{fontSize: '0.7em', padding: '0.5em 0', display: 'block', width: '100%'}} type="button" onClick={() => Meteor.logout()}>Sign out</button>
        </>) : []}

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
            The principles of least-privilege, stateless programming, and single-purpose program units are leveraged together to reduce individual application complexity.
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
            <h2>Authenticated Access</h2>
            <p>Sign in to store your profile and workspaces on the server for future use.</p>

            <div className="launcher-window wide-items">
              <Link className="launcher-button" href={`profile/`}>
                <AppIcon className="appIcon" iconSpec={{
                    type: 'glyph',
                    glyph: {
                      text: '🔐',
                      backgroundColor: 'rgba(127, 127, 127, .5)',
                    },
                  }} />
                <span className="appTitle">Sign in</span>
                <span className="appDesc">Access authenticated data.</span>
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
