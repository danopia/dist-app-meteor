import { useFind, useSubscribe, useTracker } from 'meteor/react-meteor-data';
import React, { useMemo } from 'react';

import { EntityEngine } from '/imports/engine/EntityEngine';
import { useBodyClass } from '/imports/lib/use-body-class';
import { marketUrl } from '/imports/settings';
import { AppListingEntity } from '/imports/runtime/system-apis/market';
import { AppIcon } from '../widgets/AppIcon';
import { ConnectionsPanel } from '../powerbar/ConnectionsPanel';
import { Link, useNavigate } from 'raviger';
import { LogoutPanel } from '../powerbar/LogoutPanel';
import { networkIconSvg } from '/imports/svgs/network-icon';
import { ProfilesCollection } from '/imports/db/profiles';
import { CatalogsCollection } from '/imports/db/catalogs';

export const ConfigurePage = () => {

  useBodyClass('fill-body');

  useSubscribe('/v1alpha1/profiles/list');
  const profile = useTracker(() => ProfilesCollection.findOne({}, {sort: {_id: 1}}), []);
  useSubscribe(profile && '/v1alpha1/profiles/by-id/composite', profile?._id);

  const navigate = useNavigate();

  // TODO: useMemo is the wrong tool for this
  // const engine = useMemo(() => new EntityEngine(), []);

  // const publicIndex = useMemo(() => engine
  //   .useRemoteNamespace(marketUrl)
  // , [engine, marketUrl]);

  // const appListings = useTracker(() => engine
  //   .listEntities<AppListingEntity>(
  //     'market.dist.app/v1alpha1', 'AppListing',
  //     publicIndex)
  //   .filter(x => x
  //     .metadata.tags?.includes('public-utility'))
  // , [engine, publicIndex]);

  return (
    <div className="switcher-root">
      <ul className="switcher-menu">
        <li className="switcher-icon" style={{justifyItems: 'center', margin: '0.5em 0'}}>
          <AppIcon className="appIcon" iconSpec={{
              type: 'glyph',
              glyph: {
                text: '🔧',
                backgroundColor: 'rgba(127, 127, 127, .5)',
              },
          }} sizeRatio={4} />
          <h2 style={{fontWeight: 200, margin: '0.5em 0' }}>Configure</h2>
        </li>

        <div className="one-tab">
          <button className="main" type="button" onClick={() => {
            navigate(`/configure/catalogs`);
          }}>Catalogs</button>
        </div>

        <div style={{flex: 1}} />

        <ConnectionsPanel />
        <LogoutPanel />

      </ul>

      <ConfigureCatalogs />

    </div>
  );

};

const ConfigureCatalogs = () => {
  const profile = useTracker(() => ProfilesCollection.findOne(), []);
  const catalogs = useTracker(() => CatalogsCollection.find().fetch(), []);

  return (
    <div className="splash-modal" style={{
      gridColumn: '2',
      padding: '2em 5%',
      overflowY: 'auto',
    }}>

<h1>Configure Catalogs</h1>
      <p>
        Catalogs are isolated buckets which store your Entities.
        Your Profile is composed of multiple Catalogs layered on top of each other.
        Catalogs can be used to organize data, customize storage, or share subsets of your profile.
      </p>

      <table>
        <thead>
          <tr>
            <th>Catalog ID</th>
            <th>Access Rules</th>
            <th>API Filters</th>
          </tr>
        </thead>
        <tbody>
          {catalogs.map(catalog => (
            <tr key={catalog._id}>
              <td>{catalog._id}</td>
              <td>{JSON.stringify(catalog.accessRules)}</td>
              <td>{JSON.stringify(catalog.apiFilters)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Catalog Mappings</h2>

      <table>
        <thead>
          <tr>
            <th>Layer URL</th>
            <th>API Filters</th>
          </tr>
        </thead>
        <tbody>
          {profile?.layers.map(layer => (
            <tr key={layer.backingUrl}>
              <td>{layer.backingUrl}</td>
              <td>{JSON.stringify(layer.apiFilters)}</td>
            </tr>
          )) ?? []}
        </tbody>
      </table>

    </div>
  );
}
