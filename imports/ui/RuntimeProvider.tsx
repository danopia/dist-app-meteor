import React, { ReactNode, useMemo } from 'react';
import { RuntimeContext } from './contexts';
import { EngineFactory } from '../engine/EngineFactory';

export const RuntimeProvider = (props: {
  children: ReactNode;
}) => {
  const runtime = useMemo(() => EngineFactory.forGuestSession(), []);

  return (
    <RuntimeContext.Provider value={runtime}>
      {props.children}
    </RuntimeContext.Provider>
  );
};
