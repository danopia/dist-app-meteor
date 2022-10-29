import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import React, {  } from "react";
import { ShellSyncManager } from "./ShellSyncManager";

export const ShellTopBar = (props: {
  children: React.ReactNode;
  savedSessionName?: string;
}) => {
  const user = useTracker(() => Meteor.user(), []);

  return (
    <section className="shell-powerbar">
      {user ? (<>
        <select>
          <option>[untitled scratch]</option>
          <optgroup label="change location...">
            <option disabled>local browser storage</option>
            <option disabled>server: dist.app</option>
          </optgroup>
        </select>
      </>) : (<>
        <select>
          <optgroup label="Current user">
            <option>signed out</option>
          </optgroup>
        </select>
      </>)}
      <select>
        <option>floating</option>
        <option disabled>tabbed</option>
        <option disabled>grid</option>
      </select>
      <ShellSyncManager savedSessionName={props.savedSessionName} />
      {props.children}
      <div style={{flex: 1}}></div>
      {user ? (<>
        <div style={{alignSelf: 'center', margin: '0.1em 1em'}}>
          {user?.profile.name ?? 'anonymous account'}
        </div>
        <button type="button" onClick={() => Meteor.logout()}>Sign out</button>
      </>) : []}
    </section>
  );
}
