import { EntityEngine } from "/imports/engine/EntityEngine";
import { Headers, fetch } from "meteor/fetch";

import * as webStreams from "web-streams-polyfill/ponyfill";
const WritableStream = globalThis.WritableStream ?? webStreams.WritableStream;

export async function startHttpClientOperator(opts: {
  engine: EntityEngine,
  namespace: string,
  signal: AbortSignal,
}) {

  await opts.engine.insertEntity({
    apiVersion: 'http-client.dist.app/v1alpha1',
    kind: 'Gateway',
    metadata: {
      name: 'in-page',
      namespace: opts.namespace,
    },
    spec: {
      contextType: 'BrowserPage',
      capabilities: {}, // No extra privileges
    },
    status: {
      defaultHeaders: [{
        name: 'user-agent',
        value: navigator.userAgent,
      }, {
        name: 'origin',
        value: location.origin,
      }, {
        name: 'sec-ch-ua-platform',
        //@ts-expect-error not typed
        value: navigator.userAgentData?.platform,
      }, {
        name: 'accept',
        value: '*/*',
        replaceable: true,
      }],
    },
  }).catch(err => console.log('in-page already exists?', JSON.stringify(err)));

  opts.engine.streamEntities(
    'http-client.dist.app/v1alpha1', 'HttpExchange',
    opts.namespace,
    opts.signal,
  ).then(async x => {
    x.pipeTo(new WritableStream({
      async write(evt) {
        if (evt.kind !== 'Creation') return;
        if (evt.snapshot.status) return;
        if (!evt.snapshot.spec.request.url.startsWith('https://')) return;
        const targetLabel = evt.snapshot.metadata.labels;
        console.log({targetLabel});

        await opts.engine.mutateEntity(
          'http-client.dist.app/v1alpha1', 'HttpExchange',
          evt.snapshot.metadata.namespace, evt.snapshot.metadata.name,
          cb => {
            cb.status = {
              phase: 'Inflight',
              sentAt: new Date(), // TODO: rename startedAt
            };
          });

        const sentAt = new Date();
        try {
          const resp = await fetch(evt.snapshot.spec.request.url, {
            method: evt.snapshot.spec.request.method,
            headers: new Headers(evt.snapshot.spec.request.headers.map(x => [x.name, x.value])),
          });
          const tHeaders = Date.now();
          const bodyText = await resp.text();
          const tBody = Date.now();
          await opts.engine.mutateEntity(
            'http-client.dist.app/v1alpha1', 'HttpExchange',
            evt.snapshot.metadata.namespace, evt.snapshot.metadata.name,
            cb => {
              cb.status = {
                phase: 'Completed', // 'Queued' 'Inflight' 'Failed' 'Completed'
                sentAt,
                timing: {
                  firstByteMillis: tHeaders - sentAt.valueOf(),
                  completedMillis: tBody - sentAt.valueOf(),
                },
                response: {
                  statusCode: resp.status,
                  statusText: resp.statusText,
                  headers: Array.from(resp.headers).map(x => ({name: x[0], value: x[1]})),
                  bodyText,
                },
              };
            });
        } catch (err) {
          const tCompleted = Date.now();
          await opts.engine.mutateEntity(
            'http-client.dist.app/v1alpha1', 'HttpExchange',
            evt.snapshot.metadata.namespace, evt.snapshot.metadata.name,
            cb => {
              cb.status = {
                phase: 'Failed',
                sentAt,
                timing: {
                  completedMillis: tCompleted - sentAt.valueOf(),
                },
                error: {
                  code: err.name,
                  message: err.message,
                },
              };
            });
        }
      }
    }));
  })
}
