import React from 'react';
import { AppIcon } from './widgets/AppIcon';
import { PaletteCommand } from './CommandPalette';

// const styles = makeStyles({});

export function CommandPaletteItem(item: PaletteCommand & { highlight?: Array<string>; }) {
  return (
    <div className="palette-suggestion">
      {item.category ? (
        <span className={"chrome-category " + item.category}>
          <SuggestionHighlighter text={item.category} highlightHtml={item.highlight?.[0]} />
        </span>
      ) : []}
      {item.icon ? (
        <AppIcon className="appIcon" iconSpec={item.icon} />
      ) : []}
      <SuggestionHighlighter text={item.name} highlightHtml={item.highlight?.[1]} />
    </div>
  );
}

function SuggestionHighlighter(props: {
  text: string;
  highlightHtml?: string;
}) {
  if (props.highlightHtml) return (
    <span dangerouslySetInnerHTML={{__html: props.highlightHtml}} />
  );
  return (
    <span>{props.text}</span>
  )
}
