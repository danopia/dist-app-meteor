// Doesn't seem like definitely-typed has coverage on meteor 'logging' package
// https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/meteor

//@ts-expect-error No types for this yet
import { Log } from 'meteor/logging';

// import { context, trace } from '@opentelemetry/api';
// const origGetCaller = Log._getCallerDetails;
// Log._getCallerDetails = () => {
//   if (Log.outputFormat !== 'json') return origGetCaller();
//   const ctx = trace.getActiveSpan()?.spanContext();
//   if (!ctx?.traceId) return origGetCaller();
//   return {
//     ...origGetCaller(),
//     // TODO: datadog specific - have datadog propagator do this conversion instead
//     'dd.trace_id': ctx.traceId.length == 32 ? BigInt('0x'+ctx.traceId.slice(16)).toString() : ctx.traceId,
//     'dd.span_id': ctx.spanId,
//   };
// }

declare type LogFunction = (arg: string | (Record<string, unknown> & {
  message?: string;
  app?: string;
  time?: undefined;
  timeInexact?: undefined;
  level?: undefined;
  file?: undefined;
  line?: undefined;
  program?: undefined;
  originApp?: undefined;
  satellite?: undefined;
  stderr?: undefined;
})) => void;

declare interface LogApi {
  outputFormat: 'json' | 'colored-text'
  debug: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
}
declare const Log: LogApi & LogFunction;

export { Log };

export function logError(messagePrefix: string, error: Error, extras: Record<string,unknown> = {}) {
  const summary = typeof error.stack == 'string'
    ? error.stack.split('\n')[0]
    : `Exception: ${error.message}`;

  Log.error({
    ...extras,
    message: `${messagePrefix} ${summary}`,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });
}

process.on('uncaughtExceptionMonitor', (error) => {
  logError('Uncaught', error, {
    uncaught: true,
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
process.on('unhandledRejection', (reason, promise) => {
  if (reason instanceof Error) {
    logError('Unhandled', reason, {
      uncaught: true,
    });
  } else {
    Log.error(`Unhandled non-Error rejection: ${reason}`);
  }
});
