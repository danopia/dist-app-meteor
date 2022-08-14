export type RpcListener = (rpc: Record<string,unknown>) => void | Promise<void>;

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
    const {rpc} = event.data;
    let hits = 0;
    for (const listener of this.rpcListeners) {
      if (listener[0] == rpc) {
        listener[1](event.data);
        hits++;
      }
    }
    console.log('MessageHost got message', event.data, 'for', hits, 'listeners');
  }

  addRpcListener(rpcId: string, listener: RpcListener) {
    this.rpcListeners.push([rpcId, listener]);
  }

  connectTo(otherWindow: Window) {
    if (!this.remotePort) throw new Error(`BUG: Host was already connected somewhere`);
    otherWindow.postMessage({
      protocol: 'dist.app/v1alpha1',
    }, '*', [this.remotePort]);
    this.remotePort = null;
  }
}
