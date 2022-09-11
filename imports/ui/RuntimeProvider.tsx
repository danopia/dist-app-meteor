import React, { ReactNode, useMemo } from 'react';
import { RuntimeContext } from './contexts';
import { EngineFactory } from '../engine/EngineFactory';

export const RuntimeProvider = (props: {
  children: ReactNode;
}) => {
  const runtime = useMemo(() => EngineFactory.forGuestSession(), []);
  //@ts-expect-error globalThis.runtime
  globalThis.runtime = runtime;

  return (
    <RuntimeContext.Provider value={runtime}>
      {props.children}
    </RuntimeContext.Provider>
  );
};
