import React from 'react';
import { useQueryParams } from 'raviger';

export const ShareTarget = () => {
  const [params] = useQueryParams();
  const {title, text, url} = params;

  return (
    <div>
      <pre>{JSON.stringify({title, text, url}, null, 2)}</pre>
    </div>
  );
};
