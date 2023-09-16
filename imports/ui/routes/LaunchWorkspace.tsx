import { Meteor } from 'meteor/meteor';
import React, { useEffect, useMemo } from 'react';
import { useTracker, useSubscribe, useFind } from 'meteor/react-meteor-data';
import { useNavigate } from 'raviger';

import { useBodyClass } from '/imports/lib/use-body-class';
import { ProfilesCollection } from '/imports/db/profiles';
import { ActivityShell } from '/imports/ui/ActivityShell';
import { EntityEngine } from '/imports/engine/EntityEngine';
import { WorkspaceEntity } from '/imports/entities/runtime';
import { RuntimeContext } from '/imports/ui/contexts';
import { launchNewIntent } from '/imports/runtime/workspace-actions';
import { marketUrl } from '/imports/settings';
import { FramesPanel } from '/imports/ui/tray/FramesPanel';
import { ConnectionsPanel } from '/imports/ui/tray/ConnectionsPanel';
import { LogoutPanel } from '/imports/ui/tray/LogoutPanel';
import { BrandingPanel } from '/imports/ui/tray/BrandingPanel';

import '../ViewportSwitcher.css';

export const LaunchWorkspace = (props: {
  profileId?: string;
  workspaceName?: string;
}) => {
  let {
    profileId,
    workspaceName,
  } = props;
  let showSwitcher = true;

  useBodyClass('fill-body');
  useSubscribe('/v1alpha1/profiles/list');

  const navigate = useNavigate();

  const user = useTracker(() => Meteor.user(), []);
  if (user === null) {
    profileId = 'login';
    workspaceName = 'login';
    showSwitcher = false;
  }

  const profiles = useFind(() => ProfilesCollection.find(), []);
  const profile = profiles?.find(x => x._id == profileId) ?? profiles?.[0];

  useSubscribe(profile && '/v1alpha1/profiles/by-id/composite', profile?._id);

  // TODO: useMemo is the wrong tool for this
  const engine = useMemo(() => {
    const engine = new EntityEngine();

    if (profileId == 'login') {
      engine.addNamespace({
        name: 'session',
        spec: {
          layers: [{
            mode: 'ReadWrite',
            accept: [{
              apiGroup: 'runtime.dist.app',
            }],
            storage: {
              type: 'local-inmemory',
            },
          }],
        },
      });
      engine.addNamespace({
        name: 'login',
        spec: {
          layers: [{
            // mode: 'ReadWrite',
            mode: 'ReadOnly',
            accept: [{
              apiGroup: 'profile.dist.app',
            }],
            storage: {
              type: 'profile',
              profileId: 'login',
              // type: 'local-inmemory',
            },
          }],
        },
      });
      // engine.insertEntity<AppInstallationEntity>({
      //   apiVersion: 'profile.dist.app/v1alpha1',
      //   kind: 'AppInstallation',
      //   metadata: {
      //     name: `welcome`,
      //     namespace: 'login',
      //   },
      //   spec: {
      //     appUri: `bundled:${encodeURIComponent('app:welcome')}`,
      //     // isInLauncher: true,
      //     launcherIcons: [{
      //       action: 'app.dist.Main',
      //     }],
      //     preferences: {},
      //   },
      // });
      engine.insertEntity<WorkspaceEntity>({
        apiVersion: 'runtime.dist.app/v1alpha1',
        kind: 'Workspace',
        metadata: {
          name: 'login',
          namespace: 'session',
        },
        spec: {
          windowOrder: [],
        },
      });

      const hWorkspace = engine
        .getEntityHandle<WorkspaceEntity>(
          'runtime.dist.app/v1alpha1', 'Workspace',
          'session', 'login');

      launchNewIntent(hWorkspace, {
        receiverRef: `entity://login/profile.dist.app/v1alpha1/AppInstallation/app:welcome`,
        action: 'app.dist.Main',
        category: 'app.dist.Launcher',
      });

    } else {
      engine.addNamespace({
        name: 'session',
        spec: {
          layers: [{
            mode: 'ReadWrite',
            accept: [{
            //   apiGroup: 'runtime.dist.app',
            // }, {
            //   apiGroup: 'profile.dist.app',
            // }, {
            //   apiGroup: 'manifest.dist.app',
            }],
            storage: {
              type: 'profile',
              profileId: profileId!,
              // type: 'local-inmemory',
            },
          }],
        }});

      engine.useRemoteNamespace(marketUrl);
    }

    // engine.addNamespace({
    //   name: 'profile',
    //   spec: {
    //     layers: [{
    //       mode: 'ReadWrite',
    //       accept: [{
    //         apiGroup: 'profile.dist.app',
    //       }],
    //       storage: {
    //         type: 'local-inmemory',
    //       },
    //     }],
    //   }});
    // insertGuestProfileTemplate(runtime);

    return engine;
  }, [profileId]);

  const workspaces = useTracker(() => engine
    .listEntities<WorkspaceEntity>(
      'runtime.dist.app/v1alpha1', 'Workspace', 'session')
    .map(entity => ({
      entity,
      hWorkspace: engine
        .getEntityHandle<WorkspaceEntity>(
          'runtime.dist.app/v1alpha1', 'Workspace',
          'session', entity.metadata.name),
    })), [engine]);

  useEffect(() => {
    if (!profile) {
      Meteor.callAsync('/v1alpha1/get user profile');
    }
  }, [user]);

  // if (!user) {
  //   // TODO: render the 'login' profile w/o sidebar switcher
  //   // AccountsAnonymous.login()
  //   return (
  //     <RuntimeContext.Provider value={engine}>
  //       <div className="switcher-content activity-shell-parent">
  //         <ActivityShell guest={true} workspaceName={"login"} />
  //       </div>
  //     </RuntimeContext.Provider>
  //   );
  // }
  if (!profile) {
    // TODO: render the 'login' profile w/o sidebar switcher
    // AccountsAnonymous.login()
    return (
      <div className="switcher-content">
        <div>no profile</div>
      </div>
    );
  }

  // if (user && !props.profileId) {
  //   navigate(`/profile/login`);
  //   return (
  //     <div>Redirecting to login</div>
  //   );
  // }

  if (!profileId && profile._id) {
    navigate(`/profile/${profile._id}`, { replace: true });
    return (
      <div>Redirecting to profile</div>
    );
  }

  let content = (
    <div className="switcher-content">No content!</div>
  );

  if (workspaceName) {
    content = (
      <div className="switcher-content activity-shell-parent">
        <ActivityShell guest={true} workspaceName={workspaceName} />
      </div>
    );
  } else if (workspaces.length >= 1) {
    navigate(`/profile/${profile._id}/workspace/${workspaces[0].entity.metadata.name}`, { replace: true });
  }

  //     meteorCallAsync('/v1alpha1/get user profile').then(x => {

  return (
    <RuntimeContext.Provider value={engine}>
    {/* <RuntimeProvider profileId={profile._id} engine={engine}> */}
      <div className="switcher-root">
        {showSwitcher ? (
          <ul className="switcher-menu">

            <BrandingPanel textIcon='🖥️' />

            <li style={{
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
            </li>
            {workspaces.map(x => (<>
              <li key={x.entity.metadata.name} className="switcher-icon">
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }} onClick={() => {
                    navigate(`/profile/${profile._id}/workspace/${x.entity.metadata.name}`);
                  }}>{x.entity.metadata.title ?? 'Shell'}</button>
              </li>
              <FramesPanel key={x.entity.metadata.name+"-contents"}
                  hWorkspace={x.hWorkspace}
                  profileId={profile._id}
                />
            </>))}
            <li className="switcher-icon">
              <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }} onClick={async () => {
                  const workspaceName = `shell-${Math.random().toString(16).slice(2,6)}`;
                  await engine.insertEntity<WorkspaceEntity>({
                    apiVersion: 'runtime.dist.app/v1alpha1',
                    kind: 'Workspace',
                    metadata: {
                      name: workspaceName,//'main',
                      namespace: 'session',
                    },
                    spec: {
                      windowOrder: [],
                    },
                  });
                  navigate(`/profile/${profile._id}/workspace/${workspaceName}`);
                }}>+</button>
            </li>

            <div style={{flex: 1}} />

            <ConnectionsPanel />

            <LogoutPanel />

          </ul>
        ) : []}
        {content}
      </div>
    </RuntimeContext.Provider>
  );

};
