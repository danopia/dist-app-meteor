import React, { ReactNode, useState } from 'react';
import { RuntimeContext } from './contexts';
import { EngineFactory } from '../engine/EngineFactory';

export const RuntimeProvider = (props: {
  children: ReactNode;
}) => {
  const [runtime] = useState(() => EngineFactory.forGuestSession());

  return (
    <RuntimeContext.Provider value={runtime}>
      {props.children}
    </RuntimeContext.Provider>
  );
};
