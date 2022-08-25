export type RpcListener = (event: {
  rpc: Record<string,unknown>,
  respondWith: (data: Record<string,unknown>) => void,
}) => void | Promise<void>;

export class MessageHost {
  constructor() {
    const { port1, port2 } = new MessageChannel();
    this.localPort = port1;
    this.remotePort = port2;

    this.localPort.onmessage = this.handleMessage.bind(this);
    // TODO: also messageerror
  }

  private localPort: MessagePort;
  private remotePort: MessagePort | null;
  private rpcListeners: Array<[string, RpcListener]> = [];

  handleMessage(event: MessageEvent) {
    const {rpc, id} = event.data;
    let hits = 0;
    for (const listener of this.rpcListeners) {
      if (listener[0] == rpc) {
        listener[1]({
          rpc: event.data,
          respondWith: this.respondTo.bind(this, id),
        });
        hits++;
      }
    }
    console.log('MessageHost got message', event.data, 'for', hits, 'listeners');
  }

  respondTo(msgId: number, data: Record<string, unknown>) {
    if (typeof msgId !== 'number') throw new Error(`Cannot respond to unnumbered RPC`);
    this.localPort.postMessage({
      ...data,
      rpc: 'respond',
      origId: msgId,
    });
  }

  addRpcListener(rpcId: string, listener: RpcListener) {
    this.rpcListeners.push([rpcId, listener]);
  }

  connectTo(otherWindow: Window) {
    if (!this.remotePort) throw new Error(`BUG: Host was already connected somewhere`);
    otherWindow.postMessage({
      protocol: 'protocol.dist.app/v1alpha1',
    }, '*', [this.remotePort]);
    this.remotePort = null;
  }
}
