import type { FetchRpcHandler } from "/imports/runtime/FetchRpcHandler";
import type { FetchRequestEntity, FetchResponseEntity } from "/imports/entities/protocol";
import { Meteor } from "meteor/meteor";
import { acceptTraceExport } from "/imports/lib/telemetry-store";

/**
 * # telemetry.v1alpha1.dist.app
 *
 * This API is used by:
 *   - any application which would like to submit debugging information
 * Thus it should be accessible without special request.
 */
export async function serveTelemetryApi(rpc: {
  request: FetchRequestEntity['spec'];
  path: string;
  context: FetchRpcHandler;
}): Promise<FetchResponseEntity['spec']> {

  if (rpc.path == 'otlp' && rpc.request.method == 'POST' && typeof rpc.request.body == 'string') {
    const payload = JSON.parse(rpc.request.body);

    if (payload.resourceSpans) {
      acceptTraceExport(payload);
    }

    if (payload.resourceMetrics) {
      console.log('otlp todo', await Meteor.callAsync('OTLP/v1/metrics', {
        resourceMetrics: payload.resourceMetrics,
      }));
    }

    if (payload.resourceLogs) {
      for (const log of payload.resourceLogs) {
        for (const log2 of log.scopeLogs) {
          for (const log3 of log2.logRecords) {
            console.log({log3});
            if (log3.name == 'UncaughtError') {
              const message = log3.body.attributes
                .find((x: {key: string}) => x.key == 'error.stack')
                ?.value?.stringValue
                ?? log3.body.message;
              alert('A running dist.app encountered a script error:\n\n' + message);
            }
          }
        }
      }
      console.log('otlp todo', await Meteor.callAsync('OTLP/v1/logs', {
        resourceLogs: payload.resourceLogs,
      }));
    }

    return {
      status: 200,
      headers: [['content-type', 'application/json']],
      body: '{}',
    };
  }

  return {
    status: 404,
    headers: [['content-type', 'text/plain']],
    body: 'requested telemetry API path is not found',
  };
}
