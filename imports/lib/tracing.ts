import {
  type Span,
  SpanKind,
  context,
  trace,
  SpanOptions,
  Tracer,
} from "@opentelemetry/api";
import { Meteor } from "meteor/meteor";

export class LogicTracer {
  tracer: Tracer;
  requireParent: boolean;
  constructor(options: {
    name: string;
    version?: string;
    requireParent?: boolean;
  }) {
    this.tracer = trace.getTracer(options.name, options.version);
    this.requireParent = options.requireParent ?? false;
  }

  /** Runs an async function within a new span, and then ends the span upon completion */
  async asyncSpan<T>(
    spanName: string,
    options: SpanOptions,
    func: (span: Span | null) => Promise<T> | T,
  ) {
    // if (!trace.getActiveSpan()) {
    //   const err = new Error('no parent span for '+spanName);
    //   if (!err.stack?.includes('new Computation')) console.warn('WARN:', err.stack);
    // }
    if (this.requireParent && !trace.getActiveSpan()) {
      return await func(null);
    }

    const span = this.tracer.startSpan(spanName, {
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

  /** Runs an sync function within a new span, and then ends the span upon return */
  syncSpan<T>(
    spanName: string,
    options: SpanOptions,
    func: (span: Span | null) => T,
  ) {
    // if (!trace.getActiveSpan()
    //     && !spanName.startsWith('ShellSession task:')
    //     && !spanName.startsWith('MessageHost rpc:')) {
    //   const err = new Error('no parent span for '+spanName);
    //   if (!err.stack?.includes('new Computation')) console.warn('WARN:', err.stack);
    // }
    if (this.requireParent && !trace.getActiveSpan()) {
      return func(null);
    }

    const span = this.tracer.startSpan(spanName, {
      kind: SpanKind.INTERNAL,
      ...options,
    });

    try {
      const spanContext = trace.setSpan(context.active(), span);
      return context.with(spanContext, () => func(span));
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  }

  /** Wraps an async function and returns a new function which creates a span around the promise */
  wrapAsyncWithSpan<
    Targs extends unknown[],
    Tret,
  >(
    spanName: string,
    options: SpanOptions,
    func: (...args: Targs) => Promise<Tret>,
  ) {
    return (...args: Targs) =>
      this.asyncSpan(spanName, options, () =>
        func.apply(null, args));
  }

  async tracedInterval<T>(func: () => Promise<T>, delayMs: number) {
    const funcName = func.name || `${func.toString().slice(0, 50)}...` || '(anonymous)';
    return Meteor.setInterval(this.wrapAsyncWithSpan(funcName, {
      attributes: {
        'timer.interval_ms': delayMs,
      }
    }, func), delayMs);
  }

  async tracedTimeout<T>(func: () => Promise<T>, delayMs: number) {
    const funcName = func.name || `${func.toString().slice(0, 50)}...` || '(anonymous)';
    return Meteor.setTimeout(() => this.asyncSpan(funcName, {
      attributes: {
        'timer.timeout_ms': delayMs,
      }
    }, func), delayMs);
  }
}


const defaultTracer = new LogicTracer({
  name: 'async_func',
});
export const asyncSpan = defaultTracer.asyncSpan.bind(defaultTracer);
export const syncSpan = defaultTracer.syncSpan.bind(defaultTracer);
export const wrapAsyncWithSpan = defaultTracer.wrapAsyncWithSpan.bind(defaultTracer);
export const tracedInterval = defaultTracer.tracedInterval.bind(defaultTracer);
export const tracedTimeout = defaultTracer.tracedTimeout.bind(defaultTracer);
