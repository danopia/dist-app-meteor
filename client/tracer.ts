import { DDP } from "meteor/ddp";
import { Meteor } from "meteor/meteor";

import { BatchSpanProcessor, Tracer, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { Resource } from '@opentelemetry/resources';
// import { MeteorContextManager } from "/imports/opentelemetry/context-manager";
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { context, propagation, SpanKind, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';


const Mtracer = trace.getTracer('ddp.method');

const ddp = Meteor.connection as ReturnType<typeof DDP.connect>;
// const origSend = ddp._send;
// ddp._send = function (obj: Record<string,unknown>) {
//   const ctx = context.active();
//   const baggage: Record<string,string> = {};
//   propagation.inject(ctx, baggage, {
//     set: (h, k, v) => h[k] = typeof v === 'string' ? v : String(v),
//   });
//   origSend.call(this, {
//     ...obj,
//     baggage,
//   });
// }
const origApply = ddp._apply
ddp._apply = function _apply(name, stubCallValue, args, options, callback) {
  return Mtracer.startActiveSpan(name, {
    kind: SpanKind.CLIENT,
    attributes: {
      'rpc.system': 'ddp',
      // 'ddp.user_id': this.userId ?? '',
      // 'ddp.connection': this.connection?.id,
    },
  }, span => {
    origApply.call(this, name, stubCallValue, args, options, callback);
    // span.end();
  });
};

const origMethodInvokers = ddp._methodInvokers;
ddp._methodInvokers = new Proxy<Record<string|symbol,{
  methodId: number,
  _onResultReceived: () => void;
}>>(origMethodInvokers, {
  set(self,key, value) {
    const ctx = context.active();
    const span = trace.getActiveSpan();
    const baggage: Record<string,string> = {};
    propagation.inject(ctx, baggage, {
      set: (h, k, v) => h[k] = typeof v === 'string' ? v : String(v),
    });
    value._message.baggage = baggage;
    const origCb = value._onResultReceived;
    value._onResultReceived = () => {
      span?.end();
      origCb();
    }
    // console.log('set method invoker', {self, key, value})
    self[key] = value;
    return true;
  }
})

const provider = new WebTracerProvider({
  resource: new Resource({
    'service.name': 'dist-app-meteor-web',
    'session.id': crypto.randomUUID(),
  }),
});
provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter({
  url: 'https://otel.devmode.cloud/v1/traces',
})));

provider.register({
  // contextManager: new MeteorContextManager(),
});

// Registering instrumentations
registerInstrumentations({
  instrumentations: [
    // new DocumentLoadInstrumentation(),
  ],
});
