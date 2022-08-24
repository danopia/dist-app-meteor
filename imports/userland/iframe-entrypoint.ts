const originalFetch = globalThis.fetch;
const fetchProtocols = new Map<string, typeof fetch>();
globalThis.fetch = async (req, opts) => {
  const url = new URL(req instanceof Request ? req.url : req.toString());
  console.debug('fetch to', url.protocol);
  const handler = fetchProtocols.get(url.protocol) || originalFetch;
  return await handler(req, opts);
};

globalThis.DistApp = class DistApp {
  // private readonly promises = new Map<string, [() => void, () => void]>();
  constructor(
    private readonly port: MessagePort,
  ) {
    // Hook up some handlers:
    port.addEventListener("message", evt => this
      .handleMessage(evt));
    fetchProtocols.set('web-dist-app:', (input, init) => this
      .handleFetch(new Request(input, init)));
  }
  static async connect() {
    const port = await receiveMessagePort();
    return new DistApp(port);
  }
  handleMessage(evt: MessageEvent) {
    console.warn('TODO: DistApp received:', evt.data);
  }
  async handleFetch(request: Request) {
    const payload = {
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers),
      body: await request.text(),
    };
    console.log('fetch payload', payload);
    this.sendRpc({
      rpc: 'fetch',
      spec: payload,
    });
    console.warn('TODO: returning HTTP 500');
    return new Response('TODO', { status: 500 });
    // throw new Error("TODO");
  }
  useVueState(key: string, initial: unknown) {
    console.log("TODO: useVueState", key, initial);
    return initial;
  }
  reportReady() {
    this.port.postMessage({rpc: 'reportReady'})
  }
  sendRpc(data: unknown) {
    this.port.postMessage(data);
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
