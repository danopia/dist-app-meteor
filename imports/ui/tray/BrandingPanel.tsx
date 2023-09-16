import React from 'react';

import { AppIcon } from "../widgets/AppIcon";
import { IconSpec } from "/imports/entities/manifest";


// <li className="switcher-icon" style={{justifyItems: 'center', margin: '0.5em 0'}}>
// <AppIcon iconSpec={{
//     type: 'glyph',
//     glyph: {
//       text: '🔧',
//       backgroundColor: 'rgba(127, 127, 127, .5)',
//     },
// }} sizeRatio={4} />
// <h2 style={{fontWeight: 200, margin: '0.5em 0' }}>Configure</h2>
// </li>


// <li className="switcher-icon" style={{justifyItems: 'center'}}>
// <AppIcon iconSpec={appListing?.spec.icon ?? {
//   type: 'glyph',
//   glyph: {
//     text: '⏳',
//     backgroundColor: 'rgba(127, 127, 127, .5)',
//   },
// }} sizeRatio={2} />
// {/* <button className="switcher-profile-photo" style={{
//     backgroundColor: 'gray',
//   }} /> */}
// </li>


// <li className="switcher-icon" style={{justifyItems: 'center', margin: '0.5em 0'}}>
// <AppIcon iconSpec={{
//   type: 'svg',
//   svg: {
//     textData: networkIconSvg,
//     backgroundColor: '#1155bb',
//   },
// }} sizeRatio={4} />
// <h2 style={{fontWeight: 200, margin: '0.5em 0' }}>dist.app</h2>
// </li>


// <li className="switcher-icon" style={{justifyItems: 'center'}}>
//   <button className="switcher-profile-photo" style={{
//     backgroundColor: 'gray',
//   }} />
// </li>

export const BrandingPanel = (props: {
  textIcon?: string;
  iconSpec?: IconSpec;
  brandText?: string;
}) => {
  return (
    <li className="switcher-icon" style={{justifyItems: 'center', margin: '0.5em 0'}}>
      <AppIcon iconSpec={props.iconSpec ?? {
          type: 'glyph',
          glyph: {
            text: props.textIcon ?? '',
            backgroundColor: 'rgba(127, 127, 127, .5)',
          },
      }} />
      {/* <button className="switcher-profile-photo" style={{
          backgroundColor: 'gray',
        }} /> */}
      {props.brandText ? (
        <h2 style={{fontSize: 'inherit', fontWeight: 200, margin: '0.5em 0' }}>{props.brandText}</h2>
      ) : []}
    </li>
  );
}
