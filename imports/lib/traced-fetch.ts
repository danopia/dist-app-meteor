import { fetch as MeteorFetch, Request, Headers } from "meteor/fetch";
export { Headers } from "meteor/fetch";

// copy of https://github.com/open-telemetry/opentelemetry-js/blob/ecb5ebe86eebc5a1880041b2523adf5f6d022282/experimental/packages/opentelemetry-instrumentation-fetch/src/fetch.ts
/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

interface FetchResponse {
  status: number;
  statusText?: string;
  url: string;
}
interface FetchError {
  status?: number;
  message: string;
}
interface SpanData {
  spanUrl: string;
  startTime: HrTime;
}
enum AttributeNames {
  COMPONENT = 'component',
  HTTP_ERROR_NAME = 'http.error_name',
  HTTP_STATUS_TEXT = 'http.status_text',
}

import { Context, context, HrTime, propagation, Span, SpanKind, trace } from '@opentelemetry/api';
import {
  isWrapped,
  InstrumentationBase,
  InstrumentationConfig,
  safeExecuteInTheMiddle,
} from '@opentelemetry/instrumentation';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import * as core from '@opentelemetry/core';
import { } from '@opentelemetry/sdk-trace-web';

interface FetchCustomAttributeFunction {
  (
    span: Span,
    request: Request | RequestInit,
    result: Response | FetchError
  ): void;
}

/**
 * FetchPlugin Config
 */
interface FetchInstrumentationConfig extends InstrumentationConfig {
  /**
   * URLs that partially match any regex in ignoreUrls will not be traced.
   * In addition, URLs that are _exact matches_ of strings in ignoreUrls will
   * also not be traced.
   */
  ignoreUrls?: Array<string | RegExp>;
  /** Function for adding custom attributes on the span */
  applyCustomAttributesOnSpan?: FetchCustomAttributeFunction;
  // Ignore adding network events as span events
  ignoreNetworkEvents?: boolean;
}

/**
 * This class represents a fetch plugin for auto instrumentation
 */
class DenoFetchInstrumentation {
  moduleName = 'meteor-fetch';
  tracer = trace.getTracer(this.moduleName);

  /**
   * Adds more attributes to span just before ending it
   * @param span
   * @param response
   */
  private _addFinalSpanAttributes(
    span: Span,
    response: FetchResponse
  ): void {
    const parsedUrl = new URL(response.url);
    span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, response.status);
    if (response.statusText != null) {
      span.setAttribute(AttributeNames.HTTP_STATUS_TEXT, response.statusText);
    }
    span.setAttribute(SemanticAttributes.HTTP_HOST, parsedUrl.host);
    span.setAttribute(SemanticAttributes.HTTP_ROUTE, parsedUrl.hostname); // Datadog likes having this
    span.setAttribute(
      SemanticAttributes.HTTP_SCHEME,
      parsedUrl.protocol.replace(':', '')
    );
  }

  /**
   * Add headers
   * @param options
   * @param spanUrl
   */
  private _addHeaders(ctx: Context, options: Request | RequestInit, spanUrl: string): void {
    if (options instanceof Request) {
      propagation.inject(ctx, options.headers, {
        set: (h, k, v) => h.set(k, typeof v === 'string' ? v : String(v)),
      });
    } else if (options.headers instanceof Headers) {
      propagation.inject(ctx, options.headers, {
        set: (h, k, v) => h.set(k, typeof v === 'string' ? v : String(v)),
      });
    } else {
      const headers: Partial<Record<string, unknown>> = {};
      propagation.inject(ctx, headers);
      options.headers = Object.assign({}, headers, options.headers || {});
    }
  }

  /**
   * Creates a new span
   * @param url
   * @param options
   */
  private _createSpan(
    url: string,
    options: Partial<Request | RequestInit> = {}
  ): Span | undefined {
    // if (core.isUrlIgnored(url, this._getConfig().ignoreUrls)) {
    //   this._diag.debug('ignoring span as url matches ignored url');
    //   return;
    // }
    const method = (options.method || 'GET').toUpperCase();
    const spanName = `HTTP ${method}`;
    return this.tracer.startSpan(spanName, {
      kind: SpanKind.CLIENT,
      attributes: {
        [AttributeNames.COMPONENT]: this.moduleName,
        [SemanticAttributes.HTTP_METHOD]: method,
        [SemanticAttributes.HTTP_URL]: url,
      },
    });
  }

  /**
   * Finish span, add attributes, network events etc.
   * @param span
   * @param spanData
   * @param response
   */
  private _endSpan(
    span: Span,
    spanData: SpanData,
    response: FetchResponse
  ) {
    const endTime = core.millisToHrTime(Date.now());
    this._addFinalSpanAttributes(span, response);
    span.end(endTime);
  }

  /**
   * Patches the constructor of fetch
   */
  patchConstructor(): (original: typeof fetch) => typeof fetch {
    return original => {
      const plugin = this;
      return function patchConstructor(
        this: typeof globalThis,
        ...args: Parameters<typeof fetch>
      ): Promise<Response> {
        const self = this;
        const url = new URL(
          args[0] instanceof Request ? args[0].url : String(args[0])
        ).href;

        const options = args[0] instanceof Request ? args[0] : args[1] || {};
        const createdSpan = plugin._createSpan(url, options);
        if (!createdSpan) {
          return original.apply(this, args);
        }
        const spanData = { startTime: core.hrTime(), spanUrl: url };

        function endSpanOnError(span: Span, error: FetchError) {
          // plugin._applyAttributesAfterFetch(span, options, error);
          plugin._endSpan(span, spanData, {
            status: error.status || 0,
            statusText: error.message,
            url,
          });
        }

        function endSpanOnSuccess(span: Span, response: Response) {
          // plugin._applyAttributesAfterFetch(span, options, response);
          if (response.status >= 200 && response.status < 400) {
            plugin._endSpan(span, spanData, response);
          } else {
            plugin._endSpan(span, spanData, {
              status: response.status,
              statusText: response.statusText,
              url,
            });
          }
        }

        function onSuccess(
          span: Span,
          resolve: (value: Response | PromiseLike<Response>) => void,
          response: Response
        ): void {
          try {
            const resClone = response.clone();
            const resClone4Hook = response.clone();
            resClone4Hook.body?.cancel?.();
            const body = resClone.body;
            if (body?.getReader) {
              const reader = body.getReader();
              const read = (): void => {
                reader.read().then(
                  ({ done }) => {
                    if (done) {
                      endSpanOnSuccess(span, resClone4Hook);
                    } else {
                      read();
                    }
                  },
                  error => {
                    endSpanOnError(span, error);
                  }
                );
              };
              read();
            } else {
              // some older browsers don't have .body implemented
              endSpanOnSuccess(span, response);
            }
          } finally {
            resolve(response);
          }
        }

        function onError(
          span: Span,
          reject: (reason?: unknown) => void,
          error: FetchError
        ) {
          try {
            endSpanOnError(span, error);
          } finally {
            reject(error);
          }
        }

        return new Promise((resolve, reject) => {
          const ctx = trace.setSpan(context.active(), createdSpan);
          // return context.with(
          //   trace.setSpan(context.active(), createdSpan),
          //   () => {
              plugin._addHeaders(ctx, options, url);
              // TypeScript complains about arrow function captured a this typed as globalThis
              // ts(7041)
              return original
                .apply(
                  self,
                  options instanceof Request ? [options] : [url, options]
                )
                .then(
                  onSuccess.bind(self, createdSpan, resolve),
                  onError.bind(self, createdSpan, reject)
                );
          //   }
          // );
        });
      };
    };
  }
}

export const fetch: typeof MeteorFetch = new DenoFetchInstrumentation().patchConstructor()(MeteorFetch);
