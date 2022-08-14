import { useTracker } from "meteor/react-meteor-data";
import React, { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActivityEntity, TaskEntity } from "../api/entities";
import { EntitiesCollection } from "../db/entities";
import { ActivityEmbed } from "./ActivityEmbed";
import useResizeObserver from '@react-hook/resize-observer'
import { useDebounceCallback } from "@react-hook/debounce";
import { SessionCatalog } from "../runtime/SessionCatalog";

export const ShellWindow = (props: {
  task: TaskEntity,
  sessionCatalog: SessionCatalog,
}) => {

  const activity = useTracker(() => {
    return EntitiesCollection.findOne({
      apiVersion: 'dist.app/v1alpha1',
      kind: 'Activity',
      'metadata.catalogId': props.task.spec.stack[0].activity.catalogId,
      'metadata.namespace': props.task.spec.stack[0].activity.namespace,
      'metadata.name': props.task.spec.stack[0].activity.name,
    }) as ActivityEntity | null;
  });

  const windowRef = useRef<HTMLDivElement>(null);
  const windowSize = useSize(windowRef);
  // console.log({windowSize});

  // const [seenSize, setSeenSize] = useState(windowSize);
  const observeWindowSize = useDebounceCallback((seenSize: DOMRect) => {
    const { placement } = props.task.spec;
    if (placement.type !== 'floating') return;
    console.log("Storing new window size", seenSize, 'for', props.task._id);
    props.sessionCatalog.updateEntity<TaskEntity>(props.task.apiVersion, props.task.kind, props.task.metadata.namespace, props.task.metadata.name, taskSnap => taskSnap.spec.placement = {...placement, width: seenSize!.width, height: seenSize!.height});
  }, 1000, false);
  useEffect(() => windowSize ? observeWindowSize(windowSize) : undefined  , [windowSize]);

// const resizeObserver = new ResizeObserver((entries) => {
//   for (let entry of entries) {
//     if (entry.contentBoxSize) {
//       // Firefox implements `contentBoxSize` as a single content rect, rather than an array
//       const contentBoxSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;

//       h1Elem.style.fontSize = `${Math.max(1.5, contentBoxSize.inlineSize / 200)}rem`;
//       pElem.style.fontSize = `${Math.max(1, contentBoxSize.inlineSize / 600)}rem`;
//     } else {
//       h1Elem.style.fontSize = `${Math.max(1.5, entry.contentRect.width / 200)}rem`;
//       pElem.style.fontSize = `${Math.max(1, entry.contentRect.width / 600)}rem`;
//     }
//   }

//   console.log('Size changed');
// });

// resizeObserver.observe(divElem);


  return (
    <div key={props.task._id} ref={windowRef} className="shell-window" style={props.task.spec.placement.type == 'floating' ? {left: props.task.spec.placement.left, top: props.task.spec.placement.top, width: props.task.spec.placement.width, height: props.task.spec.placement.height} : {}}>
      <section className="shell-window-handle" />
      <section className="shell-powerbar">
        <div>{props.task._id}</div>
      </section>
      {activity ? (
        <ActivityEmbed key={activity._id} activity={activity} />
      ) : []}
    </div>
  );
}

// via https://www.npmjs.com/package/@react-hook/resize-observer
const useSize = (target: RefObject<HTMLDivElement>) => {
  const [size, setSize] = useState<DOMRect>()

  useLayoutEffect(() => {
    setSize(target.current?.getBoundingClientRect())
  }, [target])

  // Where the magic happens
  useResizeObserver(target, (entry) => setSize(entry.contentRect));

  return size;
}
