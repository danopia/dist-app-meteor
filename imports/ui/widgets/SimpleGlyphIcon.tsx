import React from 'react';

import { GlyphIconSpec } from '/imports/entities/manifest';

export const SimpleGlyphIcon = (props: GlyphIconSpec['glyph']) => {
  return (
    <div
        className="appIcon"
        style={{
          // fontSize: props.sizeRatio ? `${props.sizeRatio}em` : undefined,
          backgroundColor: props.backgroundColor,
          color: props.foregroundColor,
        }}
      >
        {props.text}
    </div>
  );
}
