// @ts-expect-error untyped export
import { tracer } from 'meteor/danopia:opentelemetry';
import type { ReadableSpan, WebTracerProvider } from '@opentelemetry/sdk-trace-web'
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
import { AttributeValue, Link, SpanKind, SpanStatus } from '@opentelemetry/api';
import { ExportResult, ExportResultCode, hrTimeToMicroseconds } from '@opentelemetry/core';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const collector = new TraceCollector(SpanCollection, TraceCollection);
otelTracer.addSpanProcessor(new SimpleSpanProcessor(collector));

function deleteIrrelevantTraces() {
  const olderThan = (Date.now() - (60 * 1000)) * 1000;
  const traces = TraceCollection.find({
    resourceNames: [],
    endMicroseconds: { $lt: olderThan },
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
