import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import React from "react";

export const ShellTopBar = (props: {
  children: React.ReactNode;
}) => {
  const user = useTracker(() => Meteor.user());

  return (
    <section className="shell-powerbar">
      {user ? (<>
        <select defaultValue="dan@danopia.net">
          <optgroup label="Signed in">
            <option>{user?.emails?.[0]?.address ?? 'anonymous account'}</option>
          </optgroup>
          <option disabled>unnamed guest user</option>
          <option disabled>add user...</option>
        </select>
        <select>
          <option>[untitled scratch]</option>
          <optgroup label="change location...">
            <option disabled>local browser storage</option>
            <option disabled>server: dist.app</option>
          </optgroup>
        </select>
      </>) : (<>
        <select defaultValue="dan@danopia.net">
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
      {props.children}
      <div style={{flex: 1}}></div>
      {user ? (
        <button type="button" onClick={() => Meteor.logout()}>Sign out</button>
      ) : []}
    </section>
  );
}
