const originalFetch = globalThis.fetch;
const fetchProtocols = new Map<string, typeof fetch>();
globalThis.fetch = async (req, opts) => {
  const url = new URL(req instanceof Request ? req.url : req.toString());
  console.debug('fetch to', url.protocol);
  const handler = fetchProtocols.get(url.protocol) || originalFetch;
  return await handler(req, opts);
};

globalThis.DistApp = class DistApp {
  private nextPromise = 0;
  private readonly promises = new Map<number, [(data: Record<string, unknown>) => void, (error: Error) => void]>();
  constructor(
    private readonly port: MessagePort,
  ) {
    // Hook up some handlers:
    port.addEventListener("message", evt => this
      .handleMessage(evt));
    port.start();
    fetchProtocols.set('dist-app:', (input, init) => this
      .handleFetch(new Request(input, init)));
  }
  static async connect() {
    const port = await receiveMessagePort();
    return new DistApp(port);
  }
  handleMessage(evt: MessageEvent) {
    if (evt.data.rpc == 'respond') {
      const pair = this.promises.get(evt.data.origId);
      if (pair) {
        this.promises.delete(evt.data.origId);
        if (evt.data.error) {
          pair[1](new Error(evt.data.error));
        } else {
          pair[0](evt.data.data);
        }
        return;
      }
    }
    console.warn('TODO: DistApp received:', evt.data);
  }
  async handleFetch(request: Request) {
    const payload = {
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers),
      body: await request.text(),
    };
    const respPayload = await this.sendRpcForResult<{
      status: number;
      headers: Array<[string,string]>;
      body?: string;
    }>({
      rpc: 'fetch',
      spec: payload,
    });
    return new Response(respPayload.body, {
      status: respPayload.status,
      headers: new Headers(respPayload.headers ?? []),
    });
  }
  useVueState(key: string, initial: unknown) {
    console.log("TODO: useVueState", key, initial);
    return initial;
  }
  reportReady() {
    this.port.postMessage({rpc: 'reportReady'})
  }
  sendRpc(data: Record<string, unknown>) {
    this.port.postMessage(data);
  }
  sendRpcForResult<T = Record<string, unknown>>(data: Record<string, unknown>) {
    const promiseNum = this.nextPromise++;
    return new Promise<T>((ok, fail) => {
      this.sendRpc({ ...data, id: promiseNum });
      this.promises.set(promiseNum, [
        value => ok(value as T),
        error => fail(error),
      ]);
    });
    // dist-app:/protocolendpoints/http/invoke
  }
}

function receiveMessagePort() {
  return new Promise<MessagePort>((ok, reject) => {
    function handleEvent(event: MessageEvent) {
      if (event.origin !== "{ORIGIN}") return;
      if (typeof event.data !== 'object' || !event.data) return;
      if (typeof event.data.protocol !== 'string') return;

      window.removeEventListener("message", handleEvent);
      window.addEventListener("message", () => {
        console.error("Received a second protocol initiation?? Reloading");
        try {
          event.ports?.map(port => port.postMessage({
            rpc: 'recycle-frame',
          })) ?? [];
          if (port) reject(
            new Error("Received protocol packet without a port"));
          ok(port);
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
