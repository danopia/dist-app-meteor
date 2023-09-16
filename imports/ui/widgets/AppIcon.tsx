import React from "react";
import type { IconSpec } from "/imports/entities/manifest";

export const AppIcon = (props: {
  sizeRatio?: number;
  iconSpec: IconSpec | null;
}) => {

  // TODO: when?
  if (!props.iconSpec) return (
    <div className="appIcon" style={{
        fontSize: props.sizeRatio ? `${props.sizeRatio}em` : undefined,
        backgroundColor: 'gray',
      }} />
  );

  if (props.iconSpec.type == 'glyph') return (
    <div className="appIcon" style={{
      fontSize: props.sizeRatio ? `${props.sizeRatio}em` : undefined,
      backgroundColor: props.iconSpec.glyph.backgroundColor,
        color: props.iconSpec.glyph.foregroundColor,
      }}>{props.iconSpec.glyph.text}</div>
  );

  if (props.iconSpec.type == 'svg') return (
    <div className="appIcon" style={{
      fontSize: props.sizeRatio ? `${props.sizeRatio}em` : undefined,
      backgroundImage: `url("data:image/svg+xml;base64,${btoa(props.iconSpec.svg.textData)}")`,
        backgroundColor: props.iconSpec.svg.backgroundColor,
        backgroundRepeat: "no-repeat",
        backgroundPosition: 'center',
        backgroundSize: '65%',
      }} />
  );

  return (
    <div className="appIcon" style={{
      fontSize: props.sizeRatio ? `${props.sizeRatio}em` : undefined,
    }}>Icon TODO</div>
  );
}
