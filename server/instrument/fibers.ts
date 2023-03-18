import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';


import { MeterProvider } from '@opentelemetry/sdk-metrics';
const metricsProvider = new MeterProvider({});
metrics.setGlobalMeterProvider(metricsProvider);
metricsProvider.addMetricReader(new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter(),
  exportIntervalMillis: 5000,
}));

// await metricsProvider.forceFlush();



// import Fibers from 'fibers';
import { metrics, trace } from '@opentelemetry/api';
// import type FiberType from 'fibers';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
// let Fibers: typeof FiberType = Npm.require('fibers');
import Fibers from 'fibers';
let EventSymbol = Symbol('MontiEventSymbol');
let StartTracked = Symbol('MontiStartTracked');

// let activeFibers = 0;
let wrapped = false;

const metric = metrics.getMeter('meteor.fibers');
metric.createObservableCounter('fibers_created')
  .addCallback(x => {
    x.observe(Fibers.fibersCreated);
  });
metric.createObservableGauge('pool_size')
  .addCallback(x => x.observe(Fibers.poolSize));
const activeFibers = metric.createUpDownCounter('active_fibers');

function endAsyncEvent (fiber: InstanceType<typeof FiberType>) {
  console.log('fiber end aysync');
  if (!fiber[EventSymbol]) return;

  // const kadiraInfo = Kadira._getInfo(fiber);

  // if (!kadiraInfo) return;

  // Kadira.tracer.eventEnd(kadiraInfo.trace, fiber[EventSymbol]);

  fiber[EventSymbol] = null;
}

export function wrapFibers () {
  if (wrapped) {
    return;
  }
  wrapped = true;

  let originalYield = Fibers.yield;
  Fibers.yield = function () {
    console.log('fiber yield');
    // let kadiraInfo = Kadira._getInfo();
    // if (kadiraInfo) {
    //   let eventId = Kadira.tracer.event(kadiraInfo.trace, 'async');
    //   if (eventId) {
    //     // The event unique to this fiber
    //     // Using a symbol since Meteor doesn't copy symbols to new fibers created
    //     // for promises. This is needed so the correct event is ended when a fiber runs after being yielded.
    //     Fibers.current[EventSymbol] = eventId;
    //   }
    // }

    return originalYield();
  };

  let originalRun = Fibers.prototype.run;
  let originalThrowInto = Fibers.prototype.throwInto;

  function ensureFiberCounted (fiber) {
    // If fiber.started is true, and StartTracked is false
    // then the fiber was probably initially ran before we wrapped Fibers.run
    if (!fiber.started || !fiber[StartTracked]) {
      console.log('fiber counted');
      activeFibers.add(1);
      fiber[StartTracked] = true;
    }
  }

  Fibers.prototype.run = function (val) {
    ensureFiberCounted(this);
    console.log('fiber run');

    if (this[EventSymbol]) {
      endAsyncEvent(this);
    // } else if (!this.__kadiraInfo && Fibers.current && Fibers.current.__kadiraInfo) {
    //   // Copy kadiraInfo when packages or user code creates a new fiber
    //   // Done by many apps and packages in connect middleware since older
    //   // versions of Meteor did not do it automatically
    //   this.__kadiraInfo = Fibers.current.__kadiraInfo;
    }

    let result;
    try {
      result = originalRun.call(this, val);
    } finally {
      if (!this.started) {
        activeFibers.add(-1);
        this[StartTracked] = false;
      }
    }

    return result;
  };

  Fibers.prototype.throwInto = function (val) {
    ensureFiberCounted(this);
    endAsyncEvent(this);

    let result;

    try {
      result = originalThrowInto.call(this, val);
    } finally {
      if (!this.started) {
        activeFibers.add(-1);
        this[StartTracked] = false;
      }
    }

    return result;
  };
}
