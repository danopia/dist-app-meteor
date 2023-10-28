import "urlpattern-polyfill";

import { FetchBodyChunkEntity, FetchErrorEntity, FetchRequestEntity, FetchResponseEntity, LaunchIntentEntity, LifecycleEntity, WriteDebugEventEntity } from "../entities/protocol";
import { LogicTracer } from "../lib/tracing";
import { ApiVersionView, ApiView } from "./ApiView";
import { ArbitraryEntity } from "../entities/core";
import { Meteor } from "meteor/meteor";
import { acceptTraceExport } from "../lib/telemetry-store";
import { FetchRpcHandler } from "../runtime/FetchRpcHandler";

const tracer = new LogicTracer({
  name: 'dist.app/protocol-rpc',
  requireParent: false,
});

export class ProtocolRpcHandler implements ApiVersionView {
  constructor(
    private readonly setIframeKey: (key: number) => void,
    private readonly onLifecycle: (lifecycle: 'loading' | 'connecting' | 'ready' | 'finished') => void,
    private readonly launchIntent: (intent: LaunchIntentEntity) => void,
    private readonly fetchHandler: FetchRpcHandler,
  ) {}

  @tracer.InternalSpan
  async callRpc(apiView: ApiView, rpc: ArbitraryEntity): Promise<ArbitraryEntity | ReadableStream<ArbitraryEntity> | null> {

    if (rpc.kind == 'Lifecycle') {
      const lifecycleRpc = rpc as LifecycleEntity;
      if (lifecycleRpc.spec.stage == 'recycle') {
        this.setIframeKey(Math.random());
      } else if (lifecycleRpc.spec.stage == 'unload') {
      } else {
        this.onLifecycle(lifecycleRpc.spec.stage);
      }
      return null;
    }

    if (rpc.kind == 'LaunchIntent') {
      const launchIntent = rpc as LaunchIntentEntity;
      console.log('handling LaunchIntent', launchIntent);
      this.launchIntent(launchIntent);
      return null;
    }
    if (rpc.kind == 'FetchRequest') {
      const fetchRequest = rpc as FetchRequestEntity;
      try {
        // TODO: cancellation if we shut down
        console.log('ProtocolRpcHandler fetching', fetchRequest.spec.url);
        const {bodyChunks, ...resp} = await this.fetchHandler.handle(fetchRequest);
        if (bodyChunks) {
          return bodyChunks
            .pipeThrough(new TransformStream<FetchBodyChunkEntity['spec'], FetchBodyChunkEntity | FetchResponseEntity>({
              start(ctlr) {
                ctlr.enqueue(resp);
              },
              transform(packet, ctlr) {
                ctlr.enqueue({
                  kind: 'FetchBodyChunk',
                  spec: packet,
                });
              },
            }));
        } else {
          return resp;
        }
      } catch (err) {
        return {
          kind: 'FetchError',
          spec: {
            message: `dist.app fetch error: ${(err as Error).message}`,
          },
        } satisfies FetchErrorEntity;
      }
    }
    // TODO: remove in favor of telemetry.v1alpha1.dist.app
    if (rpc.kind == 'WriteDebugEvent') {
      const writeDebugEvent = rpc as WriteDebugEventEntity;
      // TODO: record the debug events, probably in 'session' but perhaps as 'debug.dist.app' API
      console.log({ WriteDebugEvent: writeDebugEvent.spec });
      if (writeDebugEvent.spec.error) {
        alert('A running dist.app encountered a script error:\n\n' + writeDebugEvent.spec.error.stack);
      }
      return null;
    }
    // TODO: remove in favor of telemetry.v1alpha1.dist.app
    if (rpc.kind == 'OtelExport') {
      // const otelExport = rpc as OtelExportEntity;
      if (rpc.spec.resourceSpans) {
        acceptTraceExport(rpc.spec);
      } else {
        await Meteor.callAsync('OTLP/v1/traces', rpc.spec);
      }
      return null;
    }
    throw new Error(`unimpl protocol rpc ${rpc.kind}`);
  }
}
