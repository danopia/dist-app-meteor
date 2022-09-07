
import { fetch, Headers } from 'meteor/fetch';
import { FetchRequestEntity, FetchResponseEntity } from '/imports/entities/protocol';

export async function fetchRequestEntity(req: FetchRequestEntity): Promise<FetchResponseEntity> {
  console.log('poc-http-fetch:', req);

  const proxyPrefix = 'dist-app:/protocolendpoints/openapi/proxy/https/';
  if (req.spec.url.startsWith(proxyPrefix)) {
    const realUrl = 'https://'+req.spec.url.slice(proxyPrefix.length);
    const resp = await fetch(realUrl, {
      method: req.spec.method,
      headers: new Headers(req.spec.headers ?? []),
      body: req.spec.body,
    });
    console.log(`remote server gave HTTP ${resp.status} to ${req.spec.method} ${req.spec.url}`);
    return {
      kind: 'FetchResponse',
      origId: -1,
      spec: {
        status: resp.status,
        headers: Array.from(resp.headers),
        body: await resp.text(),
      },
    };
  }

  if (req.spec.url === 'dist-app:/protocolendpoints/http/invoke' && typeof req.spec.body == 'string') {
    const spec: {input: {
      url: string;
      method: string;
      headers: Array<[string,string]>;
      body?: string;
    }} = JSON.parse(req.spec.body);
    // if (!spec.input.url.startsWith('https://da.gd/')) throw new Meteor.Error('http-sandbox',
    //   `This domain is not reachable for the current user`);

    const resp = await fetch(spec.input.url, {
      method: spec.input.method,
      headers: new Headers(spec.input.headers ?? []),
      body: spec.input.body,
    });
    console.log(`remote server gave HTTP ${resp.status} to ${spec.input.method} ${spec.input.url}`);
    return {
      kind: 'FetchResponse',
      origId: -1,
      spec: {
        status: 200,
        headers: [
          ['content-type', 'application/json'],
        ],
        body: JSON.stringify({
          status: resp.status,
          headers: Array.from(resp.headers),
          body: await resp.text(),
        }),
      },
    };
  }

  console.warn(`server got unhandled fetch for`, req.spec.url);
  return {
    kind: 'FetchResponse',
    origId: -1,
    spec: {
      status: 429,
      headers: [],
      body: 'im a teapot',
    },
  };
}
