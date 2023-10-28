import type { FetchResponseEntity, LaunchIntentEntity, LifecycleEntity, ProtocolEntity, FetchBodyChunkEntity } from "../entities/protocol.js";

const originalFetch = globalThis.fetch;
const fetchProtocols = new Map<string, typeof fetch>();
globalThis.fetch = async (req, opts) => {
  const url = new URL(req instanceof Request ? req.url : req.toString());
  console.debug('fetch to', url.protocol);
  const handler = fetchProtocols.get(url.protocol) || originalFetch;
  return await handler(req, opts);
};

const SessionId = crypto.randomUUID();

class DistApp {
  private nextPromise = 0;
  private readonly promises = new Map<number, [(data: ProtocolEntity | ReadableStream<ProtocolEntity>) => void, (error: Error) => void]>();
  private readonly streamWriters = new Map<number, WritableStreamDefaultWriter<ProtocolEntity>>();
  constructor(
    private readonly port: MessagePort,
  ) {
    // Hook up some handlers:
    port.addEventListener("message", evt => this
      .handleMessage(evt));
    port.start();

    window.addEventListener('error', evt => this
      .handleError(evt.error)
      .catch(err => console
        .error(err)));

    window.addEventListener('unhandledrejection', evt => this
      .handleError(evt.reason)
      .catch(err => console
        .error(err)));

    fetchProtocols.set('dist-app:', (input, init) => this
      .fetch(input, init));
  }
  static async connect() {
    const port = await receiveMessagePort();
    return new DistApp(port);
  }
  handleMessage(evt: MessageEvent) {
    const entity = evt.data as ProtocolEntity;

    if (!('origId' in entity) || typeof entity.origId !== 'number') {
      console.warn('DistApp got message without origId', entity);
      return;
    }

    const writer = this.streamWriters.get(entity.origId);
    if (writer) {
      if (entity.kind == 'StreamEnd') {
        if (entity.status.success) {
          writer.close();
        } else {
          writer.abort(new Error(`StreamEnd: ${entity.status.errorMessage ?? 'No message given.'}`));
        }
        this.streamWriters.delete(entity.origId);
      } else {
        writer.write(entity);
      }
      return;
    }
    if (entity.kind == 'StreamStart') {
      const pair = this.promises.get(entity.origId);
      if (pair) {
        const stream = new TransformStream<ProtocolEntity,ProtocolEntity>();
        this.promises.delete(entity.origId);
        this.streamWriters.set(entity.origId, stream.writable.getWriter());
        pair[0](stream.readable);
        return;
      }
    }

    if (entity.kind == 'FetchResponse') {
      const pair = this.promises.get(entity.origId);
      if (pair) {
        this.promises.delete(entity.origId);
        pair[0](entity);
        return;
      }
    }
    if (entity.kind == 'FetchError') {
      const pair = this.promises.get(entity.origId);
      if (pair) {
        this.promises.delete(entity.origId);
        pair[1](new Error(entity.spec.message));
        return;
      }
    }

    console.warn('TODO: DistApp received:', evt.data);
  }
  async handleError(err: Error) {
    await this.fetch('/system-api/telemetry.v1alpha1.dist.app/otlp', {
      method: 'POST',
      body: JSON.stringify({
        "resourceLogs": [{
          "resource": {
            "attributes": [
              { "key": "service.name", "value": { "stringValue": "dist.app-userland" } },
              { "key": "session.id", "value": { "stringValue": SessionId } },
            ],
          },
          "scopeLogs": [{
            "scope": {},
            "logRecords": [{
              "timeUnixNano": `${Date.now()}000000`,
              "severityNumber": 9,
              "severityText": "Info",
              "name": "UncaughtError",
              "body": {
                "stringValue": `Uncaught ${err.name} in page`,
                "attributes": [
                  { "key": "error.message", "value": { "stringValue": err.message } },
                  { "key": "error.name", "value": { "stringValue": err.name } },
                  { "key": "error.stack", "value": { "stringValue": err.stack } },
                ],
              },
            }],
          }],
        }],
      }),
    });
  }
  async mountApiBinding(apiBindingName: string) {
    const tokenResp = await this.fetch(`/ApiBinding/${apiBindingName}/mount`, {
      method: 'POST',
    });
    if (tokenResp.status == 403) return null;
    if (!tokenResp.ok) throw new Error(
      `ApiBinding Mount of ${JSON.stringify(apiBindingName)} not OK ` +
      `(HTTP ${tokenResp.status})\n\n`+
      `Upstream response body:\n${await tokenResp.text()}`);
    const token = await tokenResp.text();
    console.log({token})
    return token;
    // return new ApiBindingMount(this, apiBindingName, token);
  }
  async fetch(req: RequestInfo | URL, opts?: RequestInit, baggage?: unknown) {
    if (typeof req == 'string') {
      return await this.handleFetch({
        method: opts?.method || 'GET',
        url: req,
        headers: new Headers(opts?.headers),
        body: (opts?.body != null) ? await new Response(opts.body).text() : null,
        baggage,
      });
    }
    const request = new Request(req, opts);
    return await this.handleFetch({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: await request.text() || null,
      baggage,
    });
  }
  async handleFetch(request: {
    url: string;
    method: string;
    headers: Headers;
    body: string | Uint8Array | null;
    baggage?: unknown;
  }) {
    const respPayload = await this.sendRpcForResult<FetchResponseEntity>({
      kind: 'FetchRequest',
      id: -1,
      //@ts-expect-error: unstable API
      baggage: request.baggage,
      spec: {
        url: request.url,
        method: request.method,
        headers: Array.from(request.headers as any),
        body: request.body ?? undefined,
      },
    });
    if (respPayload instanceof ReadableStream) {
      const respReader = respPayload.getReader();
      const resp = await respReader.read();
      respReader.releaseLock();
      if (!resp.value || resp.value.kind !== 'FetchResponse') {
        throw new Error(`BUG: weird fetch stream`);
      }
      return new Response(respPayload.pipeThrough(new TransformStream<FetchResponseEntity|FetchBodyChunkEntity,string|Uint8Array>({
        transform(chunk, ctlr) {
          if (chunk.kind !== 'FetchBodyChunk') throw new Error(`BUG: weird fetch body chunk`);
          ctlr.enqueue(chunk.spec.chunk);
        },
      })), {
        status: resp.value.spec.status,
        headers: new Headers(resp.value.spec.headers ?? []),
      });

    } else {
      if (respPayload.spec.bodyStream != null) throw new Error(`TODO: stream`);
      return new Response(respPayload.spec.body || null, {
        status: respPayload.spec.status,
        headers: new Headers(respPayload.spec.headers ?? []),
      });
    }
  }
  useVueState(key: string, initial: unknown) {
    console.log("TODO: useVueState", key, initial);
    return initial;
  }
  reportReady() {
    this.sendRpc({
      kind: 'Lifecycle',
      spec: {
        stage: 'ready',
      },
    });
  }
  launchIntent(intent: LaunchIntentEntity["spec"]) {
    this.sendRpc({
      kind: 'LaunchIntent',
      spec: intent,
    });
  }
  sendRpc<Treq extends ProtocolEntity>(data: Treq) {
    this.port.postMessage(data);
  }
  // openResultStream<Tresp extends ProtocolEntity>(expectKinds: Array<string>) {}
  sendRpcForResult<Tresp extends ProtocolEntity>(data: ProtocolEntity & {id: number}) {
    const promiseNum = this.nextPromise++;
    return new Promise<Tresp | ReadableStream<Tresp>>((ok, fail) => {
      this.sendRpc({ ...data, id: promiseNum });
      this.promises.set(promiseNum, [
        value => ok(value as Tresp),
        error => fail(error),
      ]);
    });
    // dist-app:/protocolendpoints/http/invoke
  }
}
//@ts-expect-error globalThis is untyped
globalThis.DistApp = DistApp;

async function receiveMessagePort() {
  const { port1, port2 } = new MessageChannel();
  await new Promise<void>(ok => {
    if (document.readyState === 'complete') {
      ok();
    } else {
      globalThis.addEventListener('load', () => ok());
      console.log('app waited for load event');
    }
  });
  window.parent.postMessage({
    protocol: 'protocol.dist.app/v1alpha2',
  }, '*', [port2]);
  return port1;
}

class ApiBindingMount {
  constructor(
    private readonly distApp: DistApp,
    public readonly apiBindingName: string,
    private readonly token: string,
  ) {}

  async fetch(req: string, opts?: RequestInit) {
    // const headers = new Headers(opts?.headers);
    // headers.append('Authorization', `Bearer ${this.token}`);
    const apiPath = req.startsWith('/') ? req.slice(1) : (() => {
      const url = new URL(req);
      return url.pathname.slice(1) + url.search + url.hash;
    })();
    return await this.distApp.fetch(`/cap/${this.token}/${apiPath}`, {
      ...opts,
      // headers,
    });
  }
}
//@ts-expect-error globalThis is untyped
globalThis.ApiBindingMount = ApiBindingMount;
