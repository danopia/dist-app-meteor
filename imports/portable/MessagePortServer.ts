import { Attributes, context, propagation, SpanKind } from "@opentelemetry/api";

import { LogicTracer } from "../lib/tracing";
import { ApiView } from "./ApiView";
import { ArbitraryEntity } from '../entities/core';

export const WindowMap = new WeakMap<MessageEventSource, ApiView>();
export const AttributeMap = new WeakMap<MessageEventSource, Record<string,string>>();

const trr = new LogicTracer({
  name: 'dist.app/MessagePortServer',
  requireParent: false,
});

export class MessagePortServer {
  constructor(
    public readonly apiView: ApiView,
    private localPort: MessagePort,
    public readonly telemetryAttributes?: Attributes,
  ) {
    this.localPort.addEventListener('message', evt => this.handleMessage(evt));
  }

  start() {
    this.localPort.start();
  }

  handleMessage(event: MessageEvent) {
    const rpc: ArbitraryEntity = event.data;

    const ctx = propagation.extract(context.active(), rpc.baggage ?? {}, {
      get(h,k) { return h[k]; },
      keys(h) { return Object.keys(h); },
    });

    return context.with(ctx, () =>
      trr.asyncSpan(`MessagePortServer rpc: ${rpc.kind}`, {
        kind: SpanKind.SERVER,
        attributes: {
          'rpc.system': 'messagePortServer',
          'rpc.method': rpc.kind,
          ...this.telemetryAttributes,
        },
      }, async () => {

        const {baggage, id, apiVersion, ...rest} = rpc as ArbitraryEntity & {baggage: {}; id: number};
        const rpcEntity = {
          ...rest,
          apiVersion: 'protocol.dist.app/v1alpha2',
        } satisfies ArbitraryEntity;

        const response = await this.apiView.callRpc(rpcEntity);

        if (response instanceof ReadableStream) {
          // TODO: throw away this promise?
          this.streamTo(id, response);
        } else if (response) {
          this.respondTo(id, response);
        }
      }));
  }

  respondTo(msgId: number | false, data: ArbitraryEntity) {
    if (typeof msgId !== 'number') throw new Error(`Cannot respond to unnumbered RPC`);
    this.localPort.postMessage({
      ...data,
      origId: msgId,
    });
  }

  streamTo(msgId: number | false, data: ReadableStream<ArbitraryEntity>) {
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
}

// Listen for global messages in case an existing Window wants to re-establish comms
function globalMessageHandler(evt: MessageEvent) {
  if (!evt.source) return;
  if (evt.data.protocol !== 'protocol.dist.app/v1alpha2') return;

  const apiView = WindowMap.get(evt.source);
  if (!apiView) {
    console.log('ignoring message for missing WindowMap:', evt);
    return;
  }

  const [port] = evt.ports ?? [];
  if (!port) throw new Error(
    "Received protocol packet without a port");

  new MessagePortServer(apiView, port, AttributeMap.get(evt.source)).start();
};
window.addEventListener('message', globalMessageHandler);

// Try to unload the previous event handler if we see one
// This is most relevant during the HMR development loop
const myWin = window as {DistAppGlobalMessageAgainHandler?: typeof globalMessageHandler};
if (myWin.DistAppGlobalMessageAgainHandler) {
  window.removeEventListener('message', myWin.DistAppGlobalMessageAgainHandler);
}
myWin.DistAppGlobalMessageAgainHandler = globalMessageHandler;
