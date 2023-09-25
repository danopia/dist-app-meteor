import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { parse, stringify } from 'yaml'

import { RuntimeContext } from "/imports/ui/contexts";
import { LayeredNamespace } from "/imports/engine/next-gen";
import { ArbitraryEntity } from "/imports/entities/core";

export const ExplorerWindow = (props: {
  onLifecycle: (lifecycle: "loading" | "connecting" | "ready" | "finished") => void,
}) => {
  const runtime = useContext(RuntimeContext);

  const allNamespaces = useTracker(() => Object.entries(runtime.namespaces.all()).sort());
  const [currentEntity, setCurrentEntity] = useState<ArbitraryEntity | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>()

  const liveEntity = useTracker(() => currentEntity
    ? runtime.getEntity(currentEntity.apiVersion, currentEntity.kind, currentEntity.metadata.namespace, currentEntity.metadata.name)
    : null
  , [currentEntity]);

  const liveYaml = useMemo(() => {
    if (isEditing) setIsEditing(false);
    if (!liveEntity) return liveEntity;
    const {_id, catalogId, ...rest} = {...liveEntity} as Record<string,unknown>;
    return stringify(rest, { lineWidth: 0 });
  }, [liveEntity]);

  useEffect(() => {
    props.onLifecycle('ready');
  }, []);

  return (
    <div className="activity-contents-wrap" style={{ display: 'grid', gridTemplateColumns: 'minmax(33%, 10em) auto', gridTemplateRows: 'max-content 1fr' }}>
      <ul style={{ gridRow: '1 / 3', gridColumn: '1', padding: '0.5em 5%', overflowY: 'auto', listStyle: 'none', margin: 0 }}>
        {allNamespaces.map(([namespace, impl]) => (
          <ExplorerTreeNamespace key={namespace} name={namespace} namespace={impl} setCurrentEntity={setCurrentEntity} />
        ))}
      </ul>
      {liveEntity ? (<>
        <ul style={{ gridRow: '1', gridColumn: '2', display: 'flex', margin: 0, padding: 0, listStyle: 'none', backgroundColor: '#444' }}>
          <li><button onClick={() => runtime.deleteEntity(liveEntity.apiVersion, liveEntity.kind, liveEntity.metadata.namespace, liveEntity.metadata.name)}>Delete</button></li>
          {isEditing ? (<>
            <li><button onClick={() => {
              if (textareaRef.current?.value) {
                runtime.updateEntity(parse(textareaRef.current.value))
                  .then(() => setIsEditing(false))
                  .catch(err => alert(err.message));
              }
            }}>Save</button></li>
            <li><button onClick={() => setIsEditing(false)}>Cancel</button></li>
          </>) : (
            <li><button onClick={() => setIsEditing(true)}>Edit</button></li>
          )}
        </ul>
        {isEditing ? (
          <textarea ref={textareaRef} style={{ gridRow: '2', gridColumn: '2' }}>{liveYaml}</textarea>
        ) : (
          <div style={{ gridRow: '2', gridColumn: '2', padding: '0.5em 5%', overflowY: 'auto', borderLeft: '1px solid gray' }}>
            <pre>{liveYaml}</pre>
          </div>
        )}
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

            <ExplorerTreeKind key={`${x.apiVersion}/${x.kind}`}
                apiVersion={x.apiVersion}
                kind={x.kind}
                entities={x.entities}
                setCurrentEntity={props.setCurrentEntity}
              />

          ))}
        </ul>
      ) : []}
    </li>
  );
};

export const ExplorerTreeKind = (props: {
  apiVersion: string;
  kind: string;
  entities: Array<unknown>;
  setCurrentEntity: Dispatch<SetStateAction<ArbitraryEntity | null>>;
}) => {

  const [isOpen, setIsOpen] = useState(props.entities.length < 5);

  return (
    <li className="entry-item" style={{ marginTop: '0.5em' }}>
      <div className="folder-name" onClick={() => setIsOpen(!isOpen)}>
        <span className="name">{props.kind} ({props.apiVersion.split('.')[0]})</span>
      </div>

      {isOpen ? (
        <ul className="sub-tree" style={{ listStyle: 'none', paddingLeft: '0.6em', marginLeft: '0.8em', borderLeft: '1px dashed #999', borderRadius: '0 0 0 10px' }}>
          {props.entities.map(entity => (
            <li key={entity.metadata.name} className="entry-item actionable" style={{ marginTop: '0.3em' }} onClick={() => props.setCurrentEntity(entity)}>
              <div className="folder-name">
                <span className="name">{entity.metadata.name}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : []}
    </li>
  );
};
