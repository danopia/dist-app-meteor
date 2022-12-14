import type { WriteDebugEventEntity, FetchResponseEntity, LaunchIntentEntity, LifecycleEntity, ProtocolEntity } from "../entities/protocol.js";

const originalFetch = globalThis.fetch;
const fetchProtocols = new Map<string, typeof fetch>();
globalThis.fetch = async (req, opts) => {
  const url = new URL(req instanceof Request ? req.url : req.toString());
  console.debug('fetch to', url.protocol);
  const handler = fetchProtocols.get(url.protocol) || originalFetch;
  return await handler(req, opts);
};

class DistApp {
  private nextPromise = 0;
  private readonly promises = new Map<number, [(data: ProtocolEntity) => void, (error: Error) => void]>();
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
    const {name, message, stack} = err;
    this.sendRpc<WriteDebugEventEntity>({
      kind: 'WriteDebugEvent',
      spec: {
        timestamp: new Date(),
        level: 'error',
        text: `Uncaught ${name} in page`,
        error: { name, message, stack },
      },
    });
  }
  async mountApiBinding(apiBindingName: string) {
    const tokenResp = await this.fetch(`/ApiBinding/${apiBindingName}/mount`, {
      method: 'POST',
    });
    if (!tokenResp.ok) throw new Error(
      `ApiBinding Mount of ${JSON.stringify(apiBindingName)} not OK:` +
      `HTTP ${tokenResp.status} - ${await tokenResp.text()}`);
    const token = await tokenResp.text();
    return new ApiBindingMount(this, apiBindingName, token);
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
    return new Promise<Tresp>((ok, fail) => {
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
  });
}

class ApiBindingMount {
  constructor(
    private readonly distApp: DistApp,
    public readonly apiBindingName: string,
    private readonly token: string,
  ) {}

  async fetch(req: string, opts?: RequestInit) {
    const headers = new Headers(opts?.headers);
    headers.append('Authorization', `Bearer ${this.token}`);
    await this.distApp.fetch(`/ApiBinding/${this.apiBindingName}/${req.slice(1)}`, {
      ...opts,
      headers,
    });
  }
}
