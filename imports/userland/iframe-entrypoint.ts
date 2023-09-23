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

    window.addEventListener('unload', () => this
      .sendRpc({
        kind: 'Lifecycle',
        spec: {
          stage: 'unload',
        },
      }));

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
  async fetch(req: RequestInfo | URL, opts?: RequestInit) {
    if (typeof req == 'string') {
      return await this.handleFetch({
        method: opts?.method || 'GET',
        url: req,
        headers: new Headers(opts?.headers),
        body: (opts?.body != null) ? await new Response(opts.body).text() : null,
      });
    }
    const request = new Request(req, opts);
    return await this.handleFetch({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: await request.text() || null,
    });
  }
  async handleFetch(request: {
    url: string;
    method: string;
    headers: Headers;
    body: string | Uint8Array | null;
  }) {
    const respPayload = await this.sendRpcForResult<FetchResponseEntity>({
      kind: 'FetchRequest',
      id: -1,
      spec: {
        url: request.url,
        method: request.method,
        headers: Array.from(request.headers as any),
        body: request.body ?? undefined,
      },
    });
    if (respPayload.spec.bodyStream != null) throw new Error(`TODO: stream`);
    return new Response(respPayload.spec.body || null, {
      status: respPayload.spec.status,
      headers: new Headers(respPayload.spec.headers ?? []),
    });
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

function receiveMessagePort() {
  return new Promise<MessagePort>((ok, reject) => {
    function handleEvent(event: MessageEvent) {
      if (event.origin !== "{ORIGIN}") return;
      if (typeof event.data !== 'object' || !event.data) return;
      if (typeof event.data.protocol !== 'string') return;

      window.removeEventListener("message", handleEvent);
      window.addEventListener("message", (secondEvent: MessageEvent) => {
        if (secondEvent.origin !== "{ORIGIN}") return;
        console.error("Received a second protocol initiation?? Reloading");
        try {
          const entity: LifecycleEntity = {
            kind: 'Lifecycle',
            spec: {
              stage: 'recycle',
            },
          };
          event.ports?.map(port => port.postMessage(entity)) ?? [];
          if (port) reject(
            new Error("Received protocol packet without a port"));
        } finally {
          window.location.reload();
        }
      }, false);

      if (event.data.protocol !== 'protocol.dist.app/v1alpha1') reject(
        new Error("Received unexpected protocol "+event.data.protocol));
      const [port] = event.ports ?? [];
      if (!port) reject(
        new Error("Received protocol packet without a port"));
      ok(port);
    }
    window.addEventListener("message", handleEvent, false);
    // Let the host know we're waiting, in case we weren't the first frame
    window.parent.postMessage({
      'protocol': 'protocol.dist.app/v1alpha1',
    }, '*');
  });
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
