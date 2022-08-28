import { ProtocolEntity } from "../entities/protocol";

export type RpcListener<T extends ProtocolEntity> = (event: {
  rpc: T;
  respondWith<T extends ProtocolEntity>(data: Omit<T, 'origId'>): void;
}) => void | Promise<void>;

export class MessageHost {
  constructor() {
    const { port1, port2 } = new MessageChannel();
    this.localPort = port1;
    this.remotePort = port2;

    this.localPort.addEventListener("message", this.handleMessage.bind(this));
    this.localPort.start();
    // TODO: also messageerror
  }

  private localPort: MessagePort;
  private remotePort: MessagePort | null;
  private rpcListeners: Array<[ProtocolEntity["kind"], RpcListener<ProtocolEntity>]> = [];

  handleMessage(event: MessageEvent) {
    const rpc: ProtocolEntity = event.data;
    const id = rpc.kind == 'FetchRequest' ? rpc.id : false;
    let hits = 0;
    for (const listener of this.rpcListeners) {
      if (listener[0] == rpc.kind) {
        listener[1]({
          rpc: event.data,
          respondWith: this.respondTo.bind(this, id),
        });
        hits++;
      }
    }
    console.log('MessageHost got message', event.data, 'for', hits, 'listeners');
  }

  respondTo(msgId: number | false, data: ProtocolEntity) {
    if (typeof msgId !== 'number') throw new Error(`Cannot respond to unnumbered RPC`);
    this.localPort.postMessage({
      ...data,
      origId: msgId,
    });
  }

  addRpcListener<T extends ProtocolEntity>(rpcId: T["kind"], listener: RpcListener<T>) {
    this.rpcListeners.push([rpcId, listener as RpcListener<ProtocolEntity>]);
  }

  connectTo(otherWindow: Window) {
    if (!this.remotePort) throw new Error(`BUG: Host was already connected somewhere`);
    otherWindow.postMessage({
      protocol: 'protocol.dist.app/v1alpha1',
    }, '*', [this.remotePort]);
    this.remotePort = null;
  }
}
