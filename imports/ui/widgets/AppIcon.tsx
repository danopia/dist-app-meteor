import React from "react";
import type { IconSpec } from "/imports/entities/manifest";

export const AppIcon = (props: {
  className: string;
  iconSpec: IconSpec | null;
}) => {

  // TODO: when?
  if (!props.iconSpec) return (
    <div className={props.className} style={{
        backgroundColor: 'gray',
      }} />
  );

  if (props.iconSpec.type == 'glyph') return (
    <div className={props.className} style={{
        backgroundColor: props.iconSpec.glyph.backgroundColor,
        color: props.iconSpec.glyph.foregroundColor,
      }}>{props.iconSpec.glyph.text}</div>
  );

  if (props.iconSpec.type == 'svg') return (
    <div className={props.className} style={{
        backgroundImage: `url("data:image/svg+xml;base64,${btoa(props.iconSpec.svg.textData)}")`,
        backgroundColor: props.iconSpec.svg.backgroundColor,
        backgroundRepeat: "no-repeat",
        backgroundPosition: 'center',
        backgroundSize: '65%',
      }} />
  );

  return (
    <div className={props.className}>Icon TODO</div>
  );
}
