import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

// import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Context, ContextManager, ROOT_CONTEXT } from '@opentelemetry/api';
import { Meteor } from 'meteor/meteor';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

import { MongoDBInstrumentation } from "@opentelemetry/instrumentation-mongodb"

import Fiber from 'fibers';

class MeteorContextManager implements ContextManager {
  envVar: Meteor.EnvironmentVariable<Context>;
  constructor() {
    this.envVar = new Meteor.EnvironmentVariable<Context>();
  }

  rootWith?: <A extends unknown[], F extends (...args: A) => ReturnType<F>>(context: Context, fn: F, thisArg?: ThisParameterType<F> | undefined, ...args: A) => ReturnType<F>;
  rootBind?: <T>(context: Context, target: T) => T;

  active(): Context {
    if (!Fiber.current) return ROOT_CONTEXT;
    return this.envVar.getOrNullIfOutsideFiber() ?? ROOT_CONTEXT;
  }
  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(context: Context, fn: F, thisArg?: ThisParameterType<F> | undefined, ...args: A): ReturnType<F> {
    if (!Fiber.current) {
      return this.rootWith!(context, fn, thisArg);
      // return Meteor.bindEnvironment(() => this.with(context, fn, thisArg, ...args))();
      // return fn.apply(thisArg, args);
    }
    return this.envVar.withValue(context, (thisArg || args.length) ? fn.bind(thisArg, ...args) : fn);
  }
  bind<T>(context: Context, target: T): T {
    if (!Fiber.current) {
      return this.rootBind!(context, target);
      // return Meteor.bindEnvironment(() => this.with(context, fn, thisArg, ...args))();
      // return fn.apply(thisArg, args);
    }
    // if (target instanceof EventEmitter) {
    //   // throw new Error(`TODO: bind of EventEmitter`);
    //   return this._bindEventEmitter(context, target);
    // }
    if (typeof target === 'function') {
      // Seems like the easiest way to grab a specific new context for later calling
      return this.envVar.withValue(context, () => Meteor.bindEnvironment(target));
    }
    return target;
  }

  // Meteor's context manager is always active - we don't control the lifecycle
  enable(): this {
    this.rootBind = Meteor.bindEnvironment(this.bind.bind(this));
    this.rootWith = Meteor.bindEnvironment(this.with.bind(this));
    return this;
    // throw new Error('Method not implemented.');
  }
  disable(): this {
    return this;
    // throw new Error('Method not implemented.');
  }

}






// const sdk = new NodeSDK({
//   serviceName: 'dist-app-meteor',
//   instrumentations: [
//     // getNodeAutoInstrumentations(),
//   ],
//   contextManager: new MeteorContextManager,
// });
// sdk.start();

const provider = new NodeTracerProvider({
  resource: new Resource({
    'service.name': 'dist-app-meteor',
    'deployment.environment': 'local',
  }),
});
const contextManager = new MeteorContextManager().enable();
provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter()));
// provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register({
  contextManager,
});
registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations(),
    new MongoDBInstrumentation(),
  ],
  tracerProvider: provider,
})


// const x = Npm.require('mongodb');
// console.log('x', x);




// import { MeterProvider } from '@opentelemetry/sdk-metrics';
// const metricsProvider = new MeterProvider({});
// metrics.setGlobalMeterProvider(metricsProvider);
// metricsProvider.addMetricReader(new PeriodicExportingMetricReader({
//   exporter: new OTLPMetricExporter(),
//   exportIntervalMillis: 5000,
// }));

import './instrument/fibers'
// await metricsProvider.forceFlush();


import './instrument/ddp'
import './instrument/webapp'


// const tracer = trace.getTracer('mongodb');
// import { Mongo, MongoInternals } from "meteor/mongo";
// const x = Mongo.Collection.prototype as InstanceType< typeof Mongo.Collection>;
// const origFind = x.find;
// x.find = function<T> (this: Mongo.Collection<any>, ...args) {
//   return tracer.startActiveSpan('find', {}, span => {
//     try {
//       return origFind.apply(this, args)
//     } finally {
//       span.end();
//     }
//   });
// }
// const origFindOne = x.findOne;
// x.findOne = function<T> (this: Mongo.Collection<any>, ...args) {
//   return tracer.startActiveSpan('findOne '+this.rawCollection().collectionName, {}, span => {
//     try {
//       return origFindOne.apply(this, args)
//     } finally {
//       span.end();
//     }
//   });
// }

// const client = MongoInternals.defaultRemoteCollectionDriver().mongo.client;
// // contextManager.bind()
// client.on('commandStarted', evt => {
//   console.error('commandStarted', evt.commandName);
//   console.error(trace.getActiveSpan()?.isRecording())
//   console.error('fiber', Fiber.current)
//   // console.error(new Error().stack)
// })



// const mcnof_op = Npm.require('../node_modules/meteor/npm-mongo/node_modules/mongodb/lib/operations.js')
// console.log({mcnof_op})

// const mcnof_pool = Npm.require('../node_modules/meteor/npm-mongo/node_modules/mongodb/lib/cmap/connection_pool.js')
// const checkOOO = mcnof_pool.ConnectionPool.prototype.checkOut;
// mcnof_pool.ConnectionPool.prototype.checkOut = function (cb) {
//   const ctx = context.active();
//   console.log('checkout', trace.getSpan(ctx)?.isRecording());
//   checkOOO.call(this, (...args) => context.with(ctx, () => cb(...args)));
// }

// const mcnofg = Npm.require('../node_modules/meteor/npm-mongo/node_modules/mongodb/lib/cmap/connection.js')
// const ins = new MongoDBInstrumentation();
// ins.init()[1].files[0].patch(mcnofg);
// const orig = mcnofg.Connection.prototype.command;
// mcnofg.Connection.prototype.command = function (...args) {
//   console.error(args[0].collection, trace.getActiveSpan()?.isRecording());
//   if (args[0].collection == 'Profiles') console.log(new Error().stack)
//   return orig.apply(this, args);
// }




// const origOpen = MongoInternals.defaultRemoteCollectionDriver().open;
// MongoInternals.defaultRemoteCollectionDriver().mongo.client.withSession(x => x.).open = (name, conn) => {
//   console.log('open', name);
//   const coll = origOpen.call(MongoInternals.defaultRemoteCollectionDriver(), name, conn);
//   return new Proxy(coll, {
//     // apply(real, self, args) {
//     //   console.log(args);
//     //   return
//     // }
//     get(target, key) {
//       console.log('get', key);
//       return target[key];
//     }
//   })
// }


// const origMethods = Meteor.methods;
// const Mtracer = trace.getTracer('meteor.method');
// Meteor.methods = (methods) => {
//   const mapped = Object.fromEntries(Object.entries(methods).map(([name, method]) => {
//     return [name, function (this: Meteor.MethodThisType, ...args: unknown[]) {
//       return Mtracer.startActiveSpan(name, {
//         kind: SpanKind.SERVER,
//         attributes: {
//           'rpc.system': 'ddp',
//           'ddp.user_id': this.userId ?? '',
//           'ddp.connection': this.connection?.id,
//         },
//       }, async span => {
//         try {
//           return await method.apply(this, args);
//         } catch (err) {
//           span.recordException(err as Error);
//           throw err;
//         } finally {
//           span.end();
//         }
//       });
//     }];
//   }));
//   origMethods(mapped);
// }


// tracer.startSpan('demo', {}, ROOT_CONTEXT).end();

// class AbstractAsyncHooksContextManager
//   implements ContextManager
// {
//   abstract active(): Context;

//   abstract with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
//     context: Context,
//     fn: F,
//     thisArg?: ThisParameterType<F>,
//     ...args: A
//   ): ReturnType<F>;

//   abstract enable(): this;

//   abstract disable(): this;

//   /**
//    * Binds a the certain context or the active one to the target function and then returns the target
//    * @param context A context (span) to be bind to target
//    * @param target a function or event emitter. When target or one of its callbacks is called,
//    *  the provided context will be used as the active context for the duration of the call.
//    */
//   bind<T>(context: Context, target: T): T {
//     if (target instanceof EventEmitter) {
//       return this._bindEventEmitter(context, target);
//     }

//     if (typeof target === 'function') {
//       return this._bindFunction(context, target);
//     }
//     return target;
//   }

//   private _bindFunction<T extends Function>(context: Context, target: T): T {
//     const manager = this;
//     const contextWrapper = function (this: never, ...args: unknown[]) {
//       return manager.with(context, () => target.apply(this, args));
//     };
//     Object.defineProperty(contextWrapper, 'length', {
//       enumerable: false,
//       configurable: true,
//       writable: false,
//       value: target.length,
//     });
//     /**
//      * It isn't possible to tell Typescript that contextWrapper is the same as T
//      * so we forced to cast as any here.
//      */
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     return contextWrapper as any;
//   }

//   /**
//    * By default, EventEmitter call their callback with their context, which we do
//    * not want, instead we will bind a specific context to all callbacks that
//    * go through it.
//    * @param context the context we want to bind
//    * @param ee EventEmitter an instance of EventEmitter to patch
//    */
//   private _bindEventEmitter<T extends EventEmitter>(
//     context: Context,
//     ee: T
//   ): T {
//     const map = this._getPatchMap(ee);
//     if (map !== undefined) return ee;
//     this._createPatchMap(ee);

//     // patch methods that add a listener to propagate context
//     ADD_LISTENER_METHODS.forEach(methodName => {
//       if (ee[methodName] === undefined) return;
//       ee[methodName] = this._patchAddListener(ee, ee[methodName], context);
//     });
//     // patch methods that remove a listener
//     if (typeof ee.removeListener === 'function') {
//       ee.removeListener = this._patchRemoveListener(ee, ee.removeListener);
//     }
//     if (typeof ee.off === 'function') {
//       ee.off = this._patchRemoveListener(ee, ee.off);
//     }
//     // patch method that remove all listeners
//     if (typeof ee.removeAllListeners === 'function') {
//       ee.removeAllListeners = this._patchRemoveAllListeners(
//         ee,
//         ee.removeAllListeners
//       );
//     }
//     return ee;
//   }

//   /**
//    * Patch methods that remove a given listener so that we match the "patched"
//    * version of that listener (the one that propagate context).
//    * @param ee EventEmitter instance
//    * @param original reference to the patched method
//    */
//   private _patchRemoveListener(ee: EventEmitter, original: Function) {
//     const contextManager = this;
//     return function (this: never, event: string, listener: Func<void>) {
//       const events = contextManager._getPatchMap(ee)?.[event];
//       if (events === undefined) {
//         return original.call(this, event, listener);
//       }
//       const patchedListener = events.get(listener);
//       return original.call(this, event, patchedListener || listener);
//     };
//   }

//   /**
//    * Patch methods that remove all listeners so we remove our
//    * internal references for a given event.
//    * @param ee EventEmitter instance
//    * @param original reference to the patched method
//    */
//   private _patchRemoveAllListeners(ee: EventEmitter, original: Function) {
//     const contextManager = this;
//     return function (this: never, event: string) {
//       const map = contextManager._getPatchMap(ee);
//       if (map !== undefined) {
//         if (arguments.length === 0) {
//           contextManager._createPatchMap(ee);
//         } else if (map[event] !== undefined) {
//           delete map[event];
//         }
//       }
//       return original.apply(this, arguments);
//     };
//   }

//   /**
//    * Patch methods on an event emitter instance that can add listeners so we
//    * can force them to propagate a given context.
//    * @param ee EventEmitter instance
//    * @param original reference to the patched method
//    * @param [context] context to propagate when calling listeners
//    */
//   private _patchAddListener(
//     ee: EventEmitter,
//     original: Function,
//     context: Context
//   ) {
//     const contextManager = this;
//     return function (this: never, event: string, listener: Func<void>) {
//       /**
//        * This check is required to prevent double-wrapping the listener.
//        * The implementation for ee.once wraps the listener and calls ee.on.
//        * Without this check, we would wrap that wrapped listener.
//        * This causes an issue because ee.removeListener depends on the onceWrapper
//        * to properly remove the listener. If we wrap their wrapper, we break
//        * that detection.
//        */
//       if (contextManager._wrapped) {
//         return original.call(this, event, listener);
//       }
//       let map = contextManager._getPatchMap(ee);
//       if (map === undefined) {
//         map = contextManager._createPatchMap(ee);
//       }
//       let listeners = map[event];
//       if (listeners === undefined) {
//         listeners = new WeakMap();
//         map[event] = listeners;
//       }
//       const patchedListener = contextManager.bind(context, listener);
//       // store a weak reference of the user listener to ours
//       listeners.set(listener, patchedListener);

//       /**
//        * See comment at the start of this function for the explanation of this property.
//        */
//       contextManager._wrapped = true;
//       try {
//         return original.call(this, event, patchedListener);
//       } finally {
//         contextManager._wrapped = false;
//       }
//     };
//   }

//   private _createPatchMap(ee: EventEmitter): PatchMap {
//     const map = Object.create(null);
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     (ee as any)[this._kOtListeners] = map;
//     return map;
//   }
//   private _getPatchMap(ee: EventEmitter): PatchMap | undefined {
//     return (ee as never)[this._kOtListeners];
//   }

//   private readonly _kOtListeners = Symbol('OtListeners');
//   private _wrapped = false;
// }




// MongoInternals.NpmModules.mongodb.module.
