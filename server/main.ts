import './tracer';

import 'happy-eyeballs/eye-patch';

import './v1alpha1/api';

import { WebApp } from 'meteor/webapp';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('duuuh')
WebApp.connectHandlers.use('/hello', async (req, res, next) => {
  const json = {hello: 'worldaa'};

  console.error('this is hello');

  // tracer.startSpan('demoinner', {}).end();
  // tracer.startSpan('demoinner', {}).end();
  console.log('traceId:', trace.getActiveSpan()?.spanContext().traceId);

  res.writeHead(200);
  res.end(JSON.stringify(json));
})
