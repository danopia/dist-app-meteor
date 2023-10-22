// @ts-expect-error untyped export
import { tracer } from 'meteor/danopia:opentelemetry';
import type { ReadableSpan, Span, WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import type { IExportTraceServiceRequest } from '@opentelemetry/otlp-transformer'
const otelTracer = tracer as WebTracerProvider;

export interface StoredSpan {
  _id: string;
  // identifiers
  traceId: string;
  spanId: string;
  parentId?: string;
  // metadata
  traceState?: string;
  attributes: Array<[string, AttributeValue | undefined]>;
  operationName: string;
  timestampMicroseconds: number;
  durationMicroseconds: number;
  // TODO: revise all of these
  kind: SpanKind;
  status: SpanStatus;
  events: Array<{
    timeMicroseconds: number;
    name: string;
    attributes?: Array<[string, AttributeValue | undefined]>;
  }>;
  links: Link[];
}
export interface StoredTrace {
  _id: string;
  startMicroseconds: number;
  endMicroseconds: number;
  spanCount: number;
  rootSpan?: {
    spanId: string;
    operationName: string;
  }
  resourceNames: string[];
  operationNames: string[];
}

const ourGlobals = globalThis as {
  SpanCollection?: Mongo.Collection<StoredSpan>;
  TraceCollection?: Mongo.Collection<StoredTrace>;
}
export const SpanCollection = ourGlobals.SpanCollection ??= new Mongo.Collection<StoredSpan>(null);
export const TraceCollection = ourGlobals.TraceCollection ??= new Mongo.Collection<StoredTrace>(null);

class TraceCollector implements SpanExporter {
  constructor(
    private readonly spans: Mongo.Collection<StoredSpan>,
    private readonly traces: Mongo.Collection<StoredTrace>,
  ) {}
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    for (const span of spans) {
      this.spans.insert({
        _id: `${span.spanContext().traceId}-${span.spanContext().spanId}`,
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
        parentId: span.parentSpanId,

        traceState: span.spanContext().traceState?.serialize(),
        operationName: span.name,
        kind: span.kind,
        timestampMicroseconds: hrTimeToMicroseconds(span.startTime),
        durationMicroseconds: hrTimeToMicroseconds(span.duration),
        attributes: Object.entries(span.attributes),
        status: span.status,
        events: span.events.map(x => ({
          name: x.name,
          timeMicroseconds: hrTimeToMicroseconds(x.time),
          attributes: Object.entries(x.attributes ?? {}),
        })),
        links: span.links,
      });
      this.traces.upsert({
        _id: span.spanContext().traceId,
      }, {
        $min: {
          startMicroseconds: hrTimeToMicroseconds(span.startTime),
        },
        $max: {
          endMicroseconds: hrTimeToMicroseconds(span.endTime),
        },
        $inc: {
          spanCount: 1,
        },
        $addToSet: {
          // Only add resourceName if it's given
          resourceNames: {
            $each: span.attributes['resource.name'] ? [`${span.attributes['resource.name']}`] : [],
          },
          operationNames: span.name,
        },
        ...!span.parentSpanId ? {
          $set: {
            rootSpan: {
              spanId: span.spanContext().spanId,
              operationName: span.name,
            },
          },
        } : {},
      });
    }
    resultCallback({
      code: ExportResultCode.SUCCESS,
    });
  }
  async shutdown(): Promise<void> {}
}

import { SimpleSpanProcessor, SpanExporter } from '@opentelemetry/sdk-trace-web';
import { AttributeValue, Attributes, Context, HrTime, Link, SpanKind, SpanStatus, TraceState } from '@opentelemetry/api';
import { ExportResult, ExportResultCode, hrTimeToMicroseconds } from '@opentelemetry/core';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const traceCollector = new TraceCollector(SpanCollection, TraceCollection);
otelTracer.addSpanProcessor(new class RealtimeSpanProcessor extends SimpleSpanProcessor {
  constructor() {
    super(traceCollector);
  }
  onStart(span: Span, parentContext: Context): void {
    TraceCollection.upsert({
      _id: span.spanContext().traceId,
    }, {
      $min: {
        startMicroseconds: hrTimeToMicroseconds(span.startTime),
      },
      $addToSet: {
        operationNames: span.name,
      },
    });
    super.onStart(span, parentContext);
  }
}());

export function acceptTraceExport(exportData: IExportTraceServiceRequest) {
  const processor = otelTracer.getActiveSpanProcessor()
  for (const resource of exportData.resourceSpans ?? []) {
    for (const scope of resource.scopeSpans ?? []) {
      for (const span of scope.spans ?? []) {
        processor.onEnd({
          spanContext: () => ({
            traceId: span.traceId,
            spanId: span.spanId,
            traceFlags: 1,
            // isRemote: false,
            // traceState: span.traceState,
          }),
          name: span.name,
          attributes: Object.fromEntries(span.attributes.map(y => [y.key, y.value.stringValue ?? undefined])),,
          droppedAttributesCount: span.droppedAttributesCount,
          droppedEventsCount: span.droppedEventsCount,
          droppedLinksCount: span.droppedLinksCount,
          startTime: nanosToHrTime(span.startTimeUnixNano),
          endTime: nanosToHrTime(span.endTimeUnixNano),
          duration: nanosToHrTime(span.endTimeUnixNano - span.startTimeUnixNano),
          events: span.events.map(x => ({
            name: x.name,
            time: nanosToHrTime(x.timeUnixNano),
            attributes: Object.fromEntries(x.attributes.map(y => [y.key, y.value.stringValue ?? undefined])),
          })),
          ended: true,
          instrumentationLibrary: {
            name: scope.scope?.name,
            version: scope.scope?.version,
          },
          kind: span.kind,
          links: span.links.map(x => ({
            context: {
              traceId: x.traceId,
              spanId: x.spanId,
              traceFlags: 1,
              // isRemote: false,
              // traceState: x.traceState,
            },
            attributes: Object.fromEntries(x.attributes.map(y => [y.key, y.value.stringValue ?? undefined])),
            droppedAttributesCount: x.droppedAttributesCount,
          })),
          status: span.status,
          parentSpanId: span.parentSpanId,
          resource: {
            attributes: Object.fromEntries(resource.resource?.attributes.map(y => [y.key, y.value.stringValue ?? undefined]) ?? []),
          },
        });
      }
    }
  }
}

function deleteIrrelevantTraces() {
  const minuteAgo = (Date.now() - (60 * 1000)) * 1000;
  const hourAgo = (Date.now() - (60 * 60 * 1000)) * 1000;

  const traces = TraceCollection.find({
    $or: [{
      resourceNames: [],
      endMicroseconds: { $lt: minuteAgo },
    }, {
      endMicroseconds: { $lt: hourAgo },
    }],
  }).fetch();
  const traceIds = traces.map(x => x._id);

  const deletedTraces = TraceCollection.remove({
    _id: { $in: traceIds },
  });
  const deletedSpans = SpanCollection.remove({
    traceId: { $in: traceIds },
  });

  console.debug(`Deleted`, traces.length, `old traces:`, deletedTraces, 'gone,', deletedSpans, 'spans`');
}
Meteor.setInterval(deleteIrrelevantTraces, 30_000);



export function nanosToHrTime(epochNanos: number): HrTime {
  const seconds = Math.trunc(epochNanos / 1_000_000_000);
  const nanos = Math.round(epochNanos % 1_000_000_000);
  return [seconds, nanos];
}
