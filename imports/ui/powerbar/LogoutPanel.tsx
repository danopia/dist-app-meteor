import React from 'react';
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";

export const LogoutPanel = () => {
  const user = useTracker(() => Meteor.user(), []);

  if (user) {
    return (
      <button type="button"
          style={{
            fontSize: '0.7em',
            padding: '0.5em 0.5em',
            // blockSize: '100%',
            // display: 'block',
            // width: '100%',
          }}
          onClick={() => Meteor.logout()}
        >
        Sign out
      </button>
    );
  }

  return (
    <></>
  );
}
