import React, { Fragment, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import useResizeObserver from '@react-hook/resize-observer'
import { useDebounceCallback } from "@react-hook/debounce";
import GridLoader from "react-spinners/GridLoader";

export const WindowFrame = (props: {
  title: string;
  children?: JSX.Element | JSX.Element[];
  floatingRect: {
    left?: number; top?: number;
    width?: number; height?: number;
    minWidth?: number; maxWidth?: number;
    minHeight?: number; maxHeight?: number;
  };
  layoutMode: "floating";
  resizable: boolean;
  showLoader: boolean;
  onResized: (newSize: {width: number; height: number}) => void;
}) => {

  const windowRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<DOMRect>();
  useLayoutEffect(() => {
    setSize(windowRef.current?.getBoundingClientRect())
  }, [windowRef]);
  useResizeObserver(windowRef, (entry) => {
    setSize(entry.contentRect);
  });

  const observeNewSize = useDebounceCallback(props.onResized, 500, false);
  useEffect(() => size ? observeNewSize(size) : undefined, [size]);

  return (
    <div ref={windowRef}
        className="shell-window"
        style={props.layoutMode == 'floating' ? {
          ...props.floatingRect,
          resize: props.resizable ? 'both' : 'none',
        } : {}}>

      <div className="shell-window-handle">
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
        <div className="activity-contents-wrap" style={{
          alignSelf: 'center',
          justifySelf: 'center',
        }}>
          <GridLoader />
        </div>
      </Fragment>) : []}

    </div>
  );
}
