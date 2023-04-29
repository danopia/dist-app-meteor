import { context, Span, trace } from "@opentelemetry/api";
import { Meteor } from "meteor/meteor";

export function meteorCallAsync<T=unknown>(name: string, ...args: any[]) {
  return new Promise<T>((resolve, reject) =>
    Meteor.call(name, ...args, (error: unknown, result: T) => {
      if (error) return reject(error);
      resolve(result);
    })
  );
}

export function meteorCallAsyncWithSpan<T=unknown>(span: Span | undefined, name: string, ...args: any[]) {
  let ctx = context.active();
  if (span) {
    ctx = trace.setSpan(ctx, span);
  }
  return new Promise<T>((resolve, reject) =>
    context.with(ctx, () =>
      Meteor.call(name, ...args, (error: unknown, result: T) => {
        if (error) return reject(error);
        resolve(result);
      })
    ));
}
