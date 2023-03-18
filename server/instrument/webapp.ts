import { WebApp } from 'meteor/webapp';
import { context, trace, SpanKind, ROOT_CONTEXT } from '@opentelemetry/api';

const tracer = trace.getTracer('webapp');
WebApp.rawConnectHandlers.use((req,resp,next) => {
  console.log(req.method, req.url);
  const span = tracer.startSpan('webapp', {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
    },
  }, ROOT_CONTEXT);
  // resp.once('finish', () => {
  //   console.log('finish span', span.isRecording());
  //   span.end();
  // });
  resp.once('close', () => {
    // console.log('close span', span.isRecording());
    span.end();
  });
  // span.end();
  context.with(trace.setSpan(ROOT_CONTEXT, span), () => {
    next();
  });
})
