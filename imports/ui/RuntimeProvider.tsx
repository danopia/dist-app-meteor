import React, { ReactNode, useState } from 'react';
import { SessionCatalog } from '../runtime/SessionCatalog';
import { Random } from 'meteor/random';
import { Runtime } from '../runtime/Runtime';
import { RuntimeContext } from './contexts';
import { WorkspaceEntity } from '../entities/runtime';

export const RuntimeProvider = (props: {
  children: ReactNode;
}) => {
  const [runtime] = useState(() => {
    const catalog = new SessionCatalog();
    const workspaceName = Random.id();
    catalog.insertEntity<WorkspaceEntity>({
      apiVersion: 'runtime.dist.app/v1alpha1',
      kind: 'Workspace',
      metadata: {
        name: workspaceName,
      },
      spec: {
        windowOrder: [],
      },
    });
    const workspace = catalog.getEntity<WorkspaceEntity>('runtime.dist.app/v1alpha1', 'Workspace', undefined, workspaceName);
    const runtime = new Runtime(catalog, workspace);
    return runtime;
  });

  return (
    <RuntimeContext.Provider value={runtime}>
      {props.children}
    </RuntimeContext.Provider>
  );
};
