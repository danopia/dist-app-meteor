import { Attributes, context, propagation, SpanKind } from "@opentelemetry/api";
import { ProtocolEntity } from "../entities/protocol";
import { LogicTracer } from "../lib/tracing";

export type RpcListener<T extends ProtocolEntity> = (event: {
  rpc: T;
  respondWith<T extends ProtocolEntity>(data: T | ReadableStream<T>): void;
}) => void | Promise<void>;

const WindowMap = new WeakMap<MessageEventSource, MessageHost>();

const trr = new LogicTracer({
  name: 'dist.app/MessageHost',
});

export class MessageHost {
  constructor(
    public readonly telemetryAttributes?: Attributes,
  ) {
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

    const ctx = propagation.extract(context.active(), rpc.baggage ?? {}, {
      get(h,k) { return h[k]; },
      keys(h) { return Object.keys(h); },
    });

    return context.with(ctx, () =>
      trr.syncSpan(`MessageHost rpc: ${rpc.kind}`, {
        kind: SpanKind.SERVER,
        attributes: {
          'rpc.system': 'messagehost',
          'rpc.method': rpc.kind,
          ...this.telemetryAttributes,
        },
      }, async () => {
        const id = rpc.kind == 'FetchRequest' ? rpc.id : false;
        // let hits = 0;
        for (const listener of this.rpcListeners) {
          if (listener[0] == rpc.kind) {
            await listener[1]({
              rpc: event.data,
              respondWith: (data) => {
                if (data instanceof ReadableStream) {
                  this.streamTo(id, data);
                } else {
                  this.respondTo(id, data);
                }
              },
            });
            // hits++;
          }
        }
        // console.log('MessageHost got message', event.data, 'for', hits, 'listeners');
      }));
  }

  respondTo(msgId: number | false, data: ProtocolEntity) {
    if (typeof msgId !== 'number') throw new Error(`Cannot respond to unnumbered RPC`);
    this.localPort.postMessage({
      ...data,
      origId: msgId,
    });
  }

  streamTo(msgId: number | false, data: ReadableStream<ProtocolEntity>) {
    if (typeof msgId !== 'number') throw new Error(`Cannot stream to unnumbered RPC`);
    // TODO: do something with this promise
    return data.pipeTo(new WritableStream({
      start: () => {
        this.respondTo(msgId, {
          kind: 'StreamStart',
          spec: {},
        });
      },
      write: (packet) => {
        this.respondTo(msgId, packet);
      },
      abort: (reason) => {
        this.respondTo(msgId, {
          kind: 'StreamEnd',
          status: {
            success: false,
            errorMessage: `${reason}`,
          },
        });
      },
      close: () => {
        this.respondTo(msgId, {
          kind: 'StreamEnd',
          status: {
            success: true,
          },
        });
      },
    }));
  }

  addRpcListener<T extends ProtocolEntity>(rpcId: T["kind"], listener: RpcListener<T>) {
    this.rpcListeners.push([rpcId, listener as RpcListener<ProtocolEntity>]);
  }

  connectTo(otherWindow: Window) {
    if (!this.remotePort) throw new Error(`BUG: Host was already connected somewhere`);
    otherWindow.postMessage({
      protocol: 'protocol.dist.app/v1alpha1',
    }, '*', [this.remotePort]);
    WindowMap.set(otherWindow, this);
    this.remotePort = null;
  }

  /** This can happen if a client window self-reloads for any reason */
  rebindWindow(otherWindow: Window) {
    console.warn(`Rebinding MessageHost to new Window`);

    const { port1, port2: remotePort } = new MessageChannel();
    this.localPort = port1;

    this.localPort.addEventListener("message", this.handleMessage.bind(this));
    this.localPort.start();

    otherWindow.postMessage({
      protocol: 'protocol.dist.app/v1alpha1',
    }, '*', [remotePort]);
    WindowMap.set(otherWindow, this);
  }
}

// Listen for global messages in case an existing Window wants to re-establish comms
function globalMessageHandler(evt: MessageEvent) {
  if (!evt.source) return;
  if (evt.data.protocol !== 'protocol.dist.app/v1alpha1') return;

  const host = WindowMap.get(evt.source);
  if (host) {
    console.log('refusing rebind for because it breaks things');
    // host.rebindWindow(evt.source as Window);
  } else {
    console.log('refusing rebind for missing WindowMap');
  }
};
window.addEventListener('message', globalMessageHandler);

// Try to unload the previous event handler if we see one
// This is most relevant during the HMR development loop
const myWin = window as {DistAppGlobalMessageHandler?: typeof globalMessageHandler};
if (myWin.DistAppGlobalMessageHandler) {
  window.removeEventListener('message', myWin.DistAppGlobalMessageHandler);
}
myWin.DistAppGlobalMessageHandler = globalMessageHandler;
