import React, { Fragment, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import useResizeObserver from '@react-hook/resize-observer'
import { useDebounceCallback } from "@react-hook/debounce";
import GridLoader from "react-spinners/GridLoader";
import Draggable from 'react-draggable';
import useEventListener from "@use-it/event-listener";

export const WindowFrame = (props: {
  // title: string;
  children?: ReactNode;
  floatingRect: {
    left?: number; top?: number;
    width?: number; height?: number;
  };
  sizeRules?: {
    minWidth?: number; maxWidth?: number;
    minHeight?: number; maxHeight?: number;
  };
  className?: string;
  zIndex?: number;
  isRolledUp?: boolean;
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
      defaultPosition={{ x: left ?? -100, y: top ?? 500 }}
      // position={{ x: left ?? -100, y: top ?? 500 }}
      // grid={[25, 25]}
      // scale={2}
      onStop={(_evt, data) => props.onMoved({ left: data.x, top: data.y })}
    >
      <div ref={windowRef}
        className={"shell-window "+props.className + (props.isRolledUp ? ' rolled' : '')}
        style={props.layoutMode == 'floating' ? {
          zIndex: props.zIndex,

          width: rects.width,
          minWidth: props.sizeRules?.minWidth,
          maxWidth: props.sizeRules?.maxWidth,

          height: props.isRolledUp ? 'initial' : rects.height,
          minHeight: props.isRolledUp ? 'initial' : props.sizeRules?.minHeight,
          maxHeight: props.isRolledUp ? 'initial' : props.sizeRules?.maxHeight,

          resize: props.resizable
            ? (props.isRolledUp ? 'horizontal' : 'both')
            : 'none',
        } : {}}>

        <div ref={handleDiv} className="shell-window-handle">
          <div className="shell-window-grip" />
        </div>

        {props.children}

        {(props.showLoader) ? (<Fragment>
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
