import React from "react";

export const ShellTopBar = (props: {
  children: React.ReactNode;
}) => {
  return (
    <section className="shell-powerbar">
      <select defaultValue="dan@danopia.net">
        <optgroup label="Signed in">
          <option>dan@danopia.net</option>
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
      <select>
        <option>floating</option>
        <option disabled>tabbed</option>
        <option disabled>grid</option>
      </select>
      {props.children}
    </section>
  );
}
