import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { useTracker } from "meteor/react-meteor-data";

import { RuntimeContext } from "/imports/ui/contexts";
import { LayeredNamespace } from "/imports/engine/next-gen";
import { ArbitraryEntity } from "/imports/entities/core";

export const ExplorerWindow = (props: {
  onLifecycle: (lifecycle: "loading" | "connecting" | "ready" | "finished") => void,
}) => {
  const runtime = useContext(RuntimeContext);

  const allNamespaces = useTracker(() => Object.entries(runtime.namespaces.all()).sort());
  const [currentEntity, setCurrentEntity] = useState<ArbitraryEntity | null>(null);

  const liveEntity = useTracker(() => currentEntity
    ? runtime.getEntity(currentEntity.apiVersion, currentEntity.kind, currentEntity.metadata.namespace, currentEntity.metadata.name)
    : null
  , [currentEntity]);

  useEffect(() => {
    props.onLifecycle('ready');
  }, []);

  return (
    <div className="activity-contents-wrap" style={{ display: 'grid', gridTemplateColumns: 'minmax(33%, 10em) auto', gridTemplateRows: 'max-content 1fr' }}>
      <ul style={{ gridRow: '1 / 3', gridColumn: '1', padding: '0.5em 5%', overflowY: 'auto', listStyle: 'none', margin: 0 }}>
        {allNamespaces.map(([namespace, impl]) => (
          <ExplorerTreeNamespace name={namespace} namespace={impl} setCurrentEntity={setCurrentEntity} />
        ))}
      </ul>
      {liveEntity ? (<>
        <ul style={{ gridRow: '1', gridColumn: '2', display: 'flex', margin: 0, padding: 0, listStyle: 'none', backgroundColor: '#444' }}>
          <li><button onClick={() => runtime.deleteEntity(liveEntity.apiVersion, liveEntity.kind, liveEntity.metadata.namespace, liveEntity.metadata.name)}>Delete</button></li>
        </ul>
        <div style={{ gridRow: '2', gridColumn: '2', padding: '0.5em 5%', overflowY: 'auto', borderLeft: '1px solid gray' }}>
          <pre>{JSON.stringify(liveEntity ?? {}, null, 2)}</pre>
        </div>
      </>) : []}
    </div>
  );
}

export const ExplorerTreeNamespace = (props: {
  name: string,
  namespace: LayeredNamespace,
  setCurrentEntity: Dispatch<SetStateAction<ArbitraryEntity | null>>,
}) => {
  const entitiesByKind = useTracker(() => {
    const all = props.namespace.allLayers().flatMap(x => x.impl.listAllEntities()).map(x => [`${x.apiVersion}/${x.kind}`, x] as const);
    const allKinds = new Set(all.map(x => x[0]));
    const byKinds = Array.from(allKinds).map(x => all.filter(y => y[0] == x).map(y => y[1]));
    return byKinds.map(x => ({
      apiVersion: x[0].apiVersion,
      kind: x[0].kind,
      entities: x,
    }))
  });

  const [isOpen, setIsOpen] = useState(!props.name.startsWith('app:'));

  return (

    <li className="entry-item" style={{ marginBottom: '1em' }}>
      <div className="folder-name" onClick={() => setIsOpen(!isOpen)}>
        <span className="name">{props.name}</span>
      </div>

      {isOpen ? (
        <ul className="sub-tree" style={{ listStyle: 'none', paddingLeft: '0.6em', marginLeft: '0.8em', borderLeft: '1px dashed #999', borderRadius: '0 0 0 10px' }}>
          {entitiesByKind.map(x => (

            <li className="entry-item" style={{ marginTop: '0.5em' }}>
              <div className="folder-name">
                <span className="name">{x.kind} ({x.apiVersion.split('.')[0]})</span>
              </div>

              <ul className="sub-tree" style={{ listStyle: 'none', paddingLeft: '0.6em', marginLeft: '0.8em', borderLeft: '1px dashed #999', borderRadius: '0 0 0 10px' }}>
                {x.entities.map(entity => (
                  <li className="entry-item actionable" style={{ marginTop: '0.3em' }} onClick={() => props.setCurrentEntity(entity)}>
                    <div className="folder-name">
                      <span className="name">{entity.metadata.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </li>

          ))}
        </ul>
      ) : []}
    </li>
  );
};
