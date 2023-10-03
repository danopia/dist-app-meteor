import { useSubscribe, useTracker } from 'meteor/react-meteor-data';
import React from 'react';
import { useNavigate } from 'raviger';

import { ProfilesCollection } from '/imports/db/profiles';
import { CatalogsCollection } from '/imports/db/catalogs';
import { BrandingPanel } from '/imports/ui/tray/BrandingPanel';
import { ConnectionsPanel } from '/imports/ui/tray/ConnectionsPanel';
import { LogoutPanel } from '/imports/ui/tray/LogoutPanel';

export const ConfigurePage = () => {

  useSubscribe('/v1alpha1/profiles/list');
  const profile = useTracker(() => ProfilesCollection.findOne({}, {sort: {_id: 1}}), []);
  useSubscribe(profile && '/v1alpha1/profiles/by-id/composite', profile?._id);

  const navigate = useNavigate();

  return (
    <div className="switcher-root">
      <ul className="switcher-menu">

        <BrandingPanel brandText="Configure" textIcon='🔧' />

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
    <div className="switcher-content splash-modal" style={{
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
            <th>Storage</th>
          </tr>
        </thead>
        <tbody>
          {catalogs.map(catalog => (
            <tr key={catalog._id}>
              <td>{catalog._id}</td>
              <td>{JSON.stringify(catalog.accessRules)}</td>
              <td>{JSON.stringify(catalog.apiFilters)}</td>
              <td>{catalog.usage ? Math.round(catalog.usage.bytes / 1024) : '-'}Ki</td>
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
