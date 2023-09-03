import React from 'react';

export const RadioButtonList = (props: {
  name: string;
  required?: boolean;
  onChange?: React.FormEventHandler<HTMLInputElement>;
  options: Array<{
    id: string;
    label: string;
    disabled?: boolean;
    message?: string;
    props?: React.HTMLProps<HTMLInputElement>;
  }>;
  newOption?: {
    label: string;
    onActivate: () => void;
  };
}) => {
  return (
    <ul style={{padding: 0, margin: 0, listStyle: 'none'}}>
      {props.options.map(x => (
        <li key={x.id} style={{padding: '0.1em 0'}}>
          <label className="button">
            <input key={x.id}
                name={props.name} type="radio" required={props.required}
                value={x.id} disabled={x.disabled}
                onChange={props.onChange}
                {...x.props}
              />{x.label}
            {x.message ? (
              <div style={{color: '#a77', fontSize: '0.8em', textIndent: '2.3em'}}>{x.message}</div>
            ) : []}
          </label>
        </li>
      )) ?? []}
      {props.newOption ? (
        <li style={{padding: '0.1em 0'}}>
          <button type="button" className="button" onClick={props.newOption.onActivate}>
            <span style={{margin: '0 0.25em'}}>➕</span>
            {props.newOption.label}
          </button>
        </li>
      ) : []}
    </ul>
  );
}
