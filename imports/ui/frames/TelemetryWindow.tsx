import React, { useContext, useEffect, useMemo, useState } from "react";
import { useFind, useTracker } from "meteor/react-meteor-data";

import { RuntimeContext } from "/imports/ui/contexts";

import { SpanCollection, TraceCollection, StoredSpan, StoredTrace } from "/imports/lib/telemetry-store";
import { FrameEntity, WorkspaceEntity } from "/imports/entities/runtime";
import { EntityHandle } from "/imports/engine/EntityHandle";

export const TelemetryWindow = (props: {
  onLifecycle: (lifecycle: "loading" | "connecting" | "ready" | "finished") => void;
  hWorkspace: EntityHandle<WorkspaceEntity>; // TODO: technically speaking, there might be multiple workspace engines
}) => {
  const runtime = useContext(RuntimeContext);
  // const frames = runtime.
  // const frame = props.hWorkspace.getNeighborHandle
  const frameMap = useTracker(() => new Map(runtime.listEntities<FrameEntity>('runtime.dist.app/v1alpha1', 'Frame', props.hWorkspace.coords.namespace).map(x => [x.metadata.name,x])), [props.hWorkspace, runtime]);

  const recentTraceList = useTracker(() => {
    return TraceCollection.find({
      resourceNames: { $not: [] },
    }, {
      sort: { startMicroseconds: -1 },
      // fields: {
      //   'rootSpan': 1,
      //   'resourceNames': 1,
      //   'startMicroseconds': 1,
      //   'endMicroseconds': 1,
      // },
      // limit: 25,
    }).fetch();
  }, []);

  const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);

  useEffect(() => {
    props.onLifecycle('ready');
  }, []);

  return (
    <div className="activity-contents-wrap" style={{
        display: 'grid',
        // gridTemplateColumns: 'minmax(33%, 10em) auto',
        gridTemplateColumns: '1fr 2fr',
        gridTemplateRows: 'max-content 1fr',
      }}>
      <ul style={{
          gridRow: '1 / 3',
          gridColumn: '1',
          padding: 0,
          overflowY: 'auto',
          listStyle: 'none',
          margin: 0,
        }}>
        {recentTraceList.map((trace) => (
          <li key={trace._id} className="entry-item" style={{
              padding: '0.25em 5%',
              backgroundColor: trace._id == currentTraceId ? 'rgb(230,230,230)' : void 0,
            }}>
            <div className="folder-name" onClick={() => setCurrentTraceId(trace._id)}>
              <div style={{display: 'flex', justifyContent: 'space-between' }}>
                <div className="sub name">{trace.resourceNames?.map(x => frameMap.get(x)?.metadata.title ?? x).join(', ') || 'Unknown'}</div>
                <div>{new Date(trace.startMicroseconds / 1000).toLocaleTimeString([],{})}</div>
              </div>
              <div className="name">{trace.rootSpan?.operationName ?? 'unknown'}</div>
            </div>
          </li>
        ))}
      </ul>
      {/* <ul style={{
          gridRow: '1',
          gridColumn: '2',
          display: 'flex',
          margin: 0,
          padding: 0,
          listStyle: 'none',
          backgroundColor: '#444'
        }}>
        toolbar
      </ul> */}
      <div style={{
          gridRow: '2',
          gridColumn: '2',
          padding: '0.5em 5%',
          overflowY: 'auto',
          borderLeft: '1px solid gray'
        }}>
        {currentTraceId ? (
          <TraceDisplay key={currentTraceId} traceId={currentTraceId} />
        ) : 'Select a trace!'}
      </div>
      {/* {liveEntity ? (<>
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
      </>) : []} */}
    </div>
  );
}

const TraceDisplay = (props: {
  traceId: string;
}) => {

  const trace = useTracker(() => TraceCollection
    .findOne({ _id: props.traceId })
  , [props.traceId]);
  const allSpans = useTracker(() => new Map(SpanCollection
    .find({ traceId: props.traceId })
    .map(x => [x.spanId, x])
  ), [props.traceId]);

  // find the root span
  const rootSpan = allSpans.get(trace?.rootSpan?.spanId ?? 'non-extant');
  // TODO: crash if multiple root spans, probably

  // find lost spans
  // const knownSpans = new Set(allSpans.keys());
  const orphanSpans = Array.from(allSpans.values()).filter(x => x.parentId && !allSpans.has(x.parentId));
  // console.log({orphanSpans})

  if (!trace) return (
    <div>loading trace...</div>
  );

  return (<>
    <div>
      {"Trace ID: "}
      <a target="_blank" href={`https://jaeger.devmode.cloud/trace/${props.traceId}`}>
        <code>{props.traceId}</code>
      </a>
    </div>
    <div>
      <h2>{trace?.operationNames}</h2>
    </div>
    <div>{(trace.endMicroseconds-trace.startMicroseconds)/1000}ms</div>
    {rootSpan ? (
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: '200px' }}>Operation</th>
            <th></th>
            <th></th>
            <th>Timeline</th>
          </tr>
        </thead>
        <tbody>
          <SpanTree trace={trace} spanData={rootSpan} allSpans={allSpans} depth={0} />

          {orphanSpans.map(orphan => (
            <SpanTree key={orphan._id} trace={trace} spanData={orphan} allSpans={allSpans} depth={0} />
          ))}
        </tbody>
      </table>
    ) : "BUG: No parent span"}
  </>);
}

const SpanTree = (props: {
  trace: StoredTrace;
  spanData: StoredSpan;
  depth: number;
  allSpans: Map<string, StoredSpan>;
}) => {

  const children = Array.from(props.allSpans).flatMap(x => x[1].parentId == props.spanData.spanId ? [x[1]] : []);
  const attributes = useMemo(() => Object.fromEntries(props.spanData.attributes), [props.spanData.attributes]);

  const traceDuration = props.trace.endMicroseconds - props.trace.startMicroseconds;
  const beforeSpan = props.spanData.timestampMicroseconds - props.trace.startMicroseconds;
  const spanDuration = props.spanData.durationMicroseconds;
  const afterSpan = traceDuration - (spanDuration + beforeSpan);
  // console.log({beforeSpan, spanDuration, afterSpan});

  const [attrsOpen, setAttrsOpen] = useState('http.method' in attributes);
  const [childrenOpen, setChildrenOpen] = useState(true);

  return (<>
    <tr>
      <td style={{paddingLeft: `${props.depth}em`}} onClick={() => setAttrsOpen(!attrsOpen)}>
        {props.spanData.operationName}
      </td>
      <td colSpan={3} onClick={() => setChildrenOpen(!childrenOpen)}>
        <div style={{
            display: 'grid',
            height: '1.5em',
            gridTemplateColumns: `${beforeSpan}fr ${spanDuration}fr ${afterSpan}fr`,
            borderWidth: '0 1px 0 1px',
            borderStyle: 'solid',
            borderColor: 'gray',
        }}>
          <div style={{
            gridColumn: 2,
            backgroundColor: 'gray',
            border: '1px solid blue',
          }} />
        </div>
        {/* <div style={{height: '16px', left: Math.random()*100, width: '10px', backgroundColor: 'red' }} /> */}
      </td>
      {/* <td>
        {attributes['distapp.entity.kind'] ? (<span>
          {"on entity "}
          <span>{attributes['distapp.entity.kind']}</span>
          /
          <span>{attributes['distapp.entity.name']}</span>
        </span>) : []}
      </td> */}
      {/* <td>
        <code>{props.spanData.spanId}</code>
      </td> */}
    </tr>

    {attrsOpen ? (
      <tr>
        <td />
        <td>{props.spanData.kind}</td>
        <td>{props.spanData.status.code}</td>
        <td colSpan={1} style={{paddingLeft: '1em'}}>
          <table>
            <tbody>
              {/* <tr>
                <td>Kind</td>
                <td>{props.spanData.kind}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td>{props.spanData.status.code} - {props.spanData.status.message}</td>
              </tr> */}
              {props.spanData.attributes.map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </td>
      </tr>
    ) : []}

    {(childrenOpen && attributes['rpc.system'] == 'ddp') ? (
      <tr>
        <td style={{paddingLeft: `${props.depth+1}em`}}>
          <span>➡ 🌐</span>
        </td>
      </tr>
    ) : []}

    {childrenOpen ? children.map(child => (
      <SpanTree key={child._id} trace={props.trace} spanData={child} allSpans={props.allSpans} depth={props.depth+1} />
    )) : []}
  </>);
}
