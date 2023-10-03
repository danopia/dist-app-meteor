import { useTracker } from "meteor/react-meteor-data";
import { AppIcon } from "../widgets/AppIcon";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { EntityHandle } from "/imports/engine/EntityHandle";
import { ApplicationEntity } from "/imports/entities/manifest";
import { AppInstallationEntity } from "/imports/entities/profile";
import { CommandEntity, FrameEntity, WorkspaceEntity } from "/imports/entities/runtime";
import { AppListingEntity } from "/imports/runtime/system-apis/market";
import { deleteFrame } from "/imports/runtime/workspace-actions";
import { marketUrl } from "/imports/settings";

export function InstallAppFromListing(props: {
  runtime: EntityEngine;
  hWorkspace: EntityHandle<WorkspaceEntity>;
  hAppListing: EntityHandle<AppListingEntity>;
  targetNamespace: string;
  command: CommandEntity;
  cmdFrame: FrameEntity;
}) {
  const { runtime } = props;

  const appListing = useTracker(() => props.hAppListing.get(), [props.hAppListing]);

  const entities = useTracker(() => {
    if (!appListing) return {};
    const appDataUrl = `ddp-catalog://${marketUrl.split('/')[2]}/${encodeURIComponent(appListing.spec.developmentDistUrl!.split(':')[1])}`;
    const appNs = runtime.useRemoteNamespace(appDataUrl);

    return {
      appDataUrl,
      app: runtime.listEntities<ApplicationEntity>('manifest.dist.app/v1alpha1', 'Application', appNs)[0],
    };
  }, [marketUrl, appListing]);

  if (!appListing) return (
    <div className="activity-contents-wrap">No AppListing yet...</div>
  );

  if (!entities.app) return (
    <div className="activity-contents-wrap">No Application yet...</div>
  );

  return (<div className="activity-contents-wrap" style={{display: 'flex', flexDirection: 'column', gap: '1em', margin: '1em', alignItems: 'center'}}>
    You are about to install:
    <AppIcon sizeRatio={3} iconSpec={appListing.spec.icon ?? null}  />
    <h2 style={{margin: 0}}>{appListing.metadata.title}</h2>
    <p style={{margin: 0}}>from:</p>
    <h4 style={{margin: 0}}>https://{marketUrl.split('/')[2]}</h4>
    <p style={{margin: 0}}>This application will have access to:</p>
    <h4 style={{margin: 0}}>TODO</h4>
    <button onClick={() => {
      runtime.insertEntity<AppInstallationEntity>({
        apiVersion: 'profile.dist.app/v1alpha1',
        kind: 'AppInstallation',
        metadata: {
          name: `app-${appListing.metadata.name}`,
          title: appListing.metadata.title,
          namespace: props.targetNamespace,
        },
        spec: {
          appUri: entities.appDataUrl,
          launcherIcons: [{
            action: 'app.dist.Main',
          }],
          preferences: {},
        },
      });

      // TODO: this cleanup shall be done by deleteFrame
      runtime.deleteEntity<CommandEntity>('runtime.dist.app/v1alpha1', 'Command', 'session', props.command.metadata.name);
      deleteFrame(props.hWorkspace, props.cmdFrame.metadata.name);

    }}>Install development version</button>
  </div>);
}
