import {
  type Span,
  SpanKind,
  context,
  trace,
  SpanOptions,
} from "@opentelemetry/api";
import { Meteor } from "meteor/meteor";

const tracer = trace.getTracer('async_func');

/** Runs an async function within a new span, and then ends the span upon completion */
export async function asyncSpan<T>(
  spanName: string,
  options: SpanOptions,
  func: (span: Span) => Promise<T>,
) {
  const span = tracer.startSpan(spanName, {
    kind: SpanKind.INTERNAL,
    ...options,
  });

  try {
    const spanContext = trace.setSpan(context.active(), span);
    return await context.with(spanContext, () => func(span));
  } catch (err) {
    span.recordException(err as Error);
    throw err;
  } finally {
    span.end();
  }
}

/** Wraps an async function and returns a new function which creates a span around the promise */
export function wrapAsyncWithSpan<
  Targs extends unknown[],
  Tret,
>(
  spanName: string,
  options: SpanOptions,
  func: (...args: Targs) => Promise<Tret>,
) {
  return (...args: Targs) =>
    asyncSpan(spanName, options, () =>
      func.apply(null, args));
}

export async function tracedInterval<T>(func: (span: Span) => Promise<T>, delayMs: number) {
  const funcName = func.name || `${func.toString().slice(0, 50)}...` || '(anonymous)';
  return Meteor.setInterval(wrapAsyncWithSpan(funcName, {
    attributes: {
      'timer.interval_ms': delayMs,
    }
  }, func), delayMs);
}

export async function tracedTimeout<T>(func: (span: Span) => Promise<T>, delayMs: number) {
  const funcName = func.name || `${func.toString().slice(0, 50)}...` || '(anonymous)';
  return Meteor.setTimeout(() => asyncSpan(funcName, {
    attributes: {
      'timer.timeout_ms': delayMs,
    }
  }, func), delayMs);
}
