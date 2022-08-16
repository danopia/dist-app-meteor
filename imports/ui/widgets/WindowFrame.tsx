import React, { Fragment, RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import useResizeObserver from '@react-hook/resize-observer'
import { useDebounceCallback } from "@react-hook/debounce";
import GridLoader from "react-spinners/GridLoader";
import Draggable from 'react-draggable';
import useEventListener from "@use-it/event-listener";

export const WindowFrame = (props: {
  title: string;
  children?: JSX.Element | JSX.Element[];
  floatingRect: {
    left?: number; top?: number;
    width?: number; height?: number;
    minWidth?: number; maxWidth?: number;
    minHeight?: number; maxHeight?: number;
  };
  layoutMode: "floating" | "grid";
  resizable: boolean;
  showLoader: boolean;
  onResized: (newSize: { width: number; height: number }) => void;
  onMoved: (newPos: { left: number; top: number }) => void;
  onInteraction?: () => void;
}) => {

  const windowRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<DOMRect>();
  useLayoutEffect(() => {
    setSize(windowRef.current?.getBoundingClientRect())
  }, [windowRef]);
  useResizeObserver(windowRef, (entry) => {
    setSize(entry.contentRect);
  });

  // Put the window on top if the user interacts with its frame
  const onInteraction = useCallback(() => props.onInteraction?.(), [props.onInteraction]);
  useEventListener('mousedown', onInteraction, windowRef.current, {passive: true});
  useEventListener('touchstart', onInteraction, windowRef.current, {passive: true});

  const observeNewSize = useDebounceCallback(props.onResized, 500, false);
  useEffect(() => size ? observeNewSize(size) : undefined, [size]);

  const handleDiv = useRef<HTMLDivElement>(null);

  const {
    left, top,
    ...rects
  } = props.floatingRect;

  return (
    <Draggable
      handle=".shell-window-handle"
      defaultPosition={{ x: left ?? 100, y: top ?? 100 }}
      // position={null}
      // grid={[25, 25]}
      // scale={1}
      onStop={(_evt, data) => props.onMoved({ left: data.x, top: data.y })}
    >
      <div ref={windowRef}
        className="shell-window"
        style={props.layoutMode == 'floating' ? {
          ...rects,
          resize: props.resizable ? 'both' : 'none',
          // transform: `translate(${left}px, ${top}px)`,
        } : {}}>

        <div ref={handleDiv} className="shell-window-handle">
          <div className="shell-window-grip" />
        </div>
        <section className="shell-powerbar">
          <div>{props.title}</div>
        </section>

        {props.children}
        {props.showLoader ? (<Fragment>
          <div className="activity-contents-wrap" style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
          }} />
          <GridLoader className="activity-contents-wrap" style={{
            alignSelf: 'center',
            justifySelf: 'center',
          }} />
        </Fragment>) : []}

      </div>
    </Draggable>
  );
}
