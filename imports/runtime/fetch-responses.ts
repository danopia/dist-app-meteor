import { FetchResponseEntity } from "../entities/protocol";

export const makeErrorResponse = (err: Error) => {
  console.warn(`Returning error:`, err);
  return makeTextResponse(500, err.stack ?? `Server Error`);
};
export const makeStatusResponse = (status: number, message: string) => makeTextResponse(status, `${status}: ${message}`);
export function makeTextResponse(status: number, body: string): Omit<FetchResponseEntity, 'origId'> {
  return {
    kind: 'FetchResponse',
    spec: {
      status, body,
      headers: [['content-type', 'text/plain']],
    },
  };
}

export function wrapFetchResponse(x: FetchResponseEntity['spec']) {
  return {
    kind: 'FetchResponse',
    spec: x,
  } satisfies Omit<FetchResponseEntity, 'origId'>;
}
