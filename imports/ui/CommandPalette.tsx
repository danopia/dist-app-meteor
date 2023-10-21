import React, { useCallback, useContext, useMemo } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import CommandPalette, { Command } from 'react-command-palette';

import { RuntimeContext } from './contexts';
import { ActivityEntity, ApplicationEntity, IconSpec } from '../entities/manifest';
import { AppInstallationEntity } from '../entities/profile';
import { CommandPaletteItem } from './CommandPaletteItem';
import { launchNewIntent } from '/imports/runtime/workspace-actions';
import { CommandEntity, WorkspaceEntity } from '../entities/runtime';
import { EntityHandle } from '../engine/EntityHandle';
import { traceAsyncFunc } from 'meteor/danopia:opentelemetry';

export interface PaletteCommand {
  id?: string | number;
  name: string;
  category?: string;
  icon?: IconSpec | null;
  extraNames?: string;
  intent?: (CommandEntity['spec'] & {type: 'launch-intent'})['intent'];
  command: () => void;
}
function command() {}

export const MyCommandPalette = (props: {
  parentElement?: string;
  hWorkspace: EntityHandle<WorkspaceEntity>;
}) => {

  const runtime = useContext(RuntimeContext);

  const appInstallations = useTracker(() => {
    const namespaces = Array.from(runtime.getNamespacesServingApi({
      apiVersion: 'profile.dist.app/v1alpha1',
      kind: 'AppInstallation',
      op: 'Read',
    }).keys());
    const resources = namespaces.flatMap(ns => runtime
      .listEntities<AppInstallationEntity>(
        'profile.dist.app/v1alpha1', 'AppInstallation',
        ns));
    return resources;
  }, [runtime]);

  const activities = useTracker(() => {
    const appNamespaces = new Map(appInstallations.map(x =>
      [x, runtime.useRemoteNamespace(x.spec.appUri)]));

    const resources = Array.from(appNamespaces).flatMap(([appInst, ns]) => {
      const application = runtime.listEntities<ApplicationEntity>(
        'manifest.dist.app/v1alpha1', 'Application', ns).at(0);
      return runtime
        .listEntities<ActivityEntity>(
          'manifest.dist.app/v1alpha1', 'Activity', ns)
        .map(entity => ({
          appInstallation: appInst,
          appNamespace: ns,
          application,
          activity: entity,
        }));
    });
    return resources;
  }, [runtime, appInstallations]);

  const commands: Array<PaletteCommand> = [
    ...activities.flatMap<PaletteCommand>(x => x.application ? [
      {
        category: 'Activity',
        name: x.activity.metadata.title,
        id: [x.appInstallation.metadata.name, x.activity.metadata.name].join('/'),
        icon: x.activity.spec.icon ?? x.application.spec.icon ?? null,
        extraNames: [x.application.metadata.title, x.appInstallation.metadata.title].join(' '),
        intent: {
          contextRef: `entity://${x.appInstallation.metadata.namespace}/profile.dist.app/v1alpha1/AppInstallation/${x.appInstallation.metadata.name}`,
          action: 'app.dist.Main',
          // category: 'app.dist.Launcher',
          receiverRef: `entity://${x.appNamespace}/manifest.dist.app/v1alpha1/Activity/${x.activity.metadata.name}`,
        },
        command,
      }
    ] : []),
    {
      name: "Launcher",
      category: 'Action',
      icon: {type: 'glyph', glyph: {text: '?', backgroundColor: 'rgba(127, 127, 127, .5)'}},
      intent: {
        receiverRef: `internal://launcher`,
      },
      command,
    },
    {
      name: "Explorer",
      category: 'Action',
      icon: {type: 'glyph', glyph: {text: '?', backgroundColor: 'rgba(127, 127, 127, .5)'}},
      intent: {
        receiverRef: `internal://explorer`,
      },
      command,
    },
    {
      name: "Telemetry",
      category: 'Action',
      icon: {type: 'glyph', glyph: {text: '?', backgroundColor: 'rgba(127, 127, 127, .5)'}},
      intent: {
        receiverRef: `internal://telemetry`,
      },
      command,
    },
    // {
    //   name: "Upload Session",
    //   category: 'Action',
    //   icon: {type: 'glyph', glyph: {text: '?', backgroundColor: 'rgba(127, 127, 127, .5)'}},
    //   command,
    // },
  ];

  return (
    <CommandPalette
        closeOnSelect={true}
        commands={commands as Command[]}
        // trigger={null}
        reactModalParentSelector={props.parentElement ?? "#react-target"}
        resetInputOnOpen={true}
        options={{
          keys: ['category', 'name', 'extraNames'] as Array<keyof PaletteCommand>,
        }}
        renderCommand={CommandPaletteItem}
        onSelect={(selected: Partial<PaletteCommand>) => {
          if (selected.intent) {
            traceAsyncFunc('launchNewIntent', () =>
              launchNewIntent(props.hWorkspace, selected.intent!));
          }
        }}
      />
  );
};
