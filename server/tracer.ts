import 'meteor/danopia:opentelemetry';

import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// // We patch 'request' library so that the Kubernetes client is traced properly
// require('request/lib/helpers').defer = (cb: () => unknown) => {
//   const current = context.active();
//   queueMicrotask(() => {
//     context.with(current, cb);
//   });
// }

registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook(req) {
          if (req.url == '/healthz' || req.url == '/readyz') return true;
          if (req.url?.startsWith('/sockjs/')) return true;
          return false;
        },
      },
      '@opentelemetry/instrumentation-net': {
        enabled: false,
      },
    }),
  ],
});
