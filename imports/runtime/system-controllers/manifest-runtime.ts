import { OpenAPIV3 } from "openapi-types";
import { EntityEngine } from "/imports/engine/EntityEngine";
import { ApiEntity } from "/imports/entities/manifest";
import { RestCallEntity, RestConnectionEntity } from "/imports/entities/manifest-runtime";
import { parse } from "yaml";
import { AsyncCache, AsyncKeyedCache } from "../async-cache";
import { context, propagation } from "@opentelemetry/api";

export async function startManifestRuntimeOperator(opts: {
  engine: EntityEngine,
  namespace: string,
  signal: AbortSignal,
}) {

  // await opts.engine.insertEntity({
  //   apiVersion: 'http-client.dist.app/v1alpha1',
  //   kind: 'Gateway',
  //   metadata: {
  //     name: 'in-page',
  //     namespace: opts.namespace,
  //   },
  //   spec: {
  //     contextType: 'BrowserPage',
  //     capabilities: {}, // No extra privileges
  //   },
  //   status: {
  //     defaultHeaders: [{
  //       name: 'user-agent',
  //       value: navigator.userAgent,
  //     }, {
  //       name: 'origin',
  //       value: location.origin,
  //     }, {
  //       name: 'sec-ch-ua-platform',
  //       //@ts-expect-error not typed
  //       value: navigator.userAgentData?.platform,
  //     }, {
  //       name: 'accept',
  //       value: '*/*',
  //       replaceable: true,
  //     }],
  //   },
  // }).catch(err => console.log('in-page already exists?', JSON.stringify(err)));

  const apiCache = new AsyncCache({
    async loadFunc(apiName: string) {

      const hApi = opts.engine.getEntityHandle<ApiEntity>('manifest.dist.app/v1alpha1', 'Api', 'src', apiName);
      let api = await hApi.getAsync(AbortSignal.timeout(10_000));
      if (!api) {
        throw new Error(`API didn't show up`);
      }

      if (api.spec.type !== 'openapi') throw new Error(
        `TODO: non-openapi Api entity: ${JSON.stringify(api.spec.type)}`);
      const apiDefinition = parse(api.spec.definition) as OpenAPIV3.Document;

      // Collect all operations into one array
      const operations = Object
        .entries(apiDefinition.paths)
        .flatMap(([path, methods]) => [
          ...(methods?.get    ? [{ ...methods.get,    path, method: 'get'    }] : []),
          ...(methods?.head   ? [{ ...methods.head,   path, method: 'head'   }] : []),
          ...(methods?.post   ? [{ ...methods.post,   path, method: 'post'   }] : []),
          ...(methods?.patch  ? [{ ...methods.patch,  path, method: 'patch'  }] : []),
          ...(methods?.put    ? [{ ...methods.put,    path, method: 'put'    }] : []),
          ...(methods?.delete ? [{ ...methods.delete, path, method: 'delete' }] : []),
        ]);

      return {
        entity: api,
        definition: apiDefinition,
        operations,
      };
    }
  });

  opts.engine.streamEntities(
    'manifest-runtime.dist.app/v1alpha1', 'RestConnection',
    opts.namespace,
    opts.signal,
  ).then(async x => {
    x.pipeTo(new WritableStream({
      async write(evt) {
        if (evt.kind !== 'Creation') return;
        const restConnection = evt.snapshot as RestConnectionEntity;

        const api = await apiCache.get(restConnection.spec.apiName);

        if (api.entity.spec.crossOriginResourceSharing == 'open' && !restConnection.spec.authentication) {

          await opts.engine
            .getEntityHandle<RestConnectionEntity>(
              'manifest-runtime.dist.app/v1alpha1', 'RestConnection',
              restConnection.metadata.namespace!, restConnection.metadata.name)
            .mutate(snap => {
              snap.status = {
                selectedEndpoint: api.definition.servers?.[0].url,
                exitLocation: 'Browser',
                // permissionGrantName: '',
              };
            });

          return;
        }

        if (restConnection.spec.authentication?.requestSecuritySchemes) {
          const schema = api.definition.components?.securitySchemes?.[restConnection.spec.authentication.requestSecuritySchemes[0]];
          console.log(JSON.stringify(schema,null,2));
        }

        alert('new unhandled RestConnection:\n'+JSON.stringify({
          restConnection,
          api,
        }, null, 2));

        // await opts.engine.mutateEntity(
        //   'http-client.dist.app/v1alpha1', 'HttpExchange',
        //   evt.snapshot.metadata.namespace, evt.snapshot.metadata.name,
        //   cb => {
        //     cb.status = {
        //       phase: 'Inflight',
        //       sentAt: new Date(), // TODO: rename startedAt
        //     };
        //   });

      }
    }));
  });

  opts.engine.streamEntities(
    'manifest-runtime.dist.app/v1alpha1', 'RestCall',
    opts.namespace,
    opts.signal,
  ).then(async x => {
    x.pipeTo(new WritableStream({
      async write(evt) {
        if (evt.kind !== 'Creation') return;
        const restCall = evt.snapshot as RestCallEntity;

        const baggage = JSON.parse(restCall.metadata.annotations?.['otel/baggage'] ?? '{}');
        const traceCtx = propagation.extract(context.active(), baggage, {
          get(h,k) { return h[k]; },
          keys(h) { return Object.keys(h); },
        });

        const restConnection = opts.engine
          .getEntityHandle<RestConnectionEntity>(
            'manifest-runtime.dist.app/v1alpha1', 'RestConnection',
            opts.namespace, restCall.spec.restConnectionName)
          .get();
        if (!restConnection) throw new Error(`connection not found`);

        const api = await context.with(traceCtx, () => apiCache.get(restConnection.spec.apiName));

        const operation = api.operations.find(x => x.operationId == restCall.spec.operationId);
        if (!operation) throw new Error(`Operation not found`);

        // if (api.entity.spec.crossOriginResourceSharing == 'open' && !restConnection.spec.authentication) {

        //   await opts.engine
        //     .getEntityHandle<RestConnectionEntity>(
        //       'manifest-runtime.dist.app/v1alpha1', 'RestConnection',
        //       restConnection.metadata.namespace!, restConnection.metadata.name)
        //     .mutate(snap => {
        //       snap.status = {
        //         selectedEndpoint: api.definition.servers?.[0].url,
        //         exitLocation: 'Browser',
        //         // permissionGrantName: '',
        //       };
        //     });

        //   return;
        // }

        // alert('new unhandled RestCall:\n'+JSON.stringify({
        //   restCall,
        //   restConnection,
        //   api,
        // }, null, 2));
        // console.log({
        //   restCall,
        //   restConnection,
        //   operation,
        // });

        if (operation.method !== 'get') throw new Error(`TODO: non-GET operation`);

        const url = new URL(operation.path, restConnection.status?.selectedEndpoint);
        const givenParams = new Set(Object.keys(restCall.spec.parameters));
        for (const param of operation.parameters ?? []) {
          if ('$ref' in param) throw new Error(`TODO: ref param`);
          if (!param.schema) throw new Error(`TODO: no param schema`);
          if ('$ref' in param.schema) throw new Error(`TODO: ref param schema`);
          givenParams.delete(param.name);
          switch (param.in) {
            case 'query': {
              if (!['string', 'integer', 'boolean'].includes(param.schema.type??'')) throw new Error(`TODO: query param ${param.name} type ${param.schema.type}`);
              if (restCall.spec.parameters[param.name] != null) {
                url.searchParams.append(param.name, `${restCall.spec.parameters[param.name]}`);
              } else if (param.required) throw new Error(`TODO: missing required param ${param.name}`);
            } break;
            case 'path': {
              if (!['string', 'integer', 'boolean'].includes(param.schema.type??'')) throw new Error(`TODO: path param ${param.name} type ${param.schema.type}`);
              if (restCall.spec.parameters[param.name] != null) {
                // TODO: better constraints
                url.pathname = url.pathname.replaceAll(encodeURIComponent(`{${param.name}}`), `${restCall.spec.parameters[param.name]}`);
              } else if (param.required) throw new Error(`TODO: missing required param ${param.name}`);
            } break;
            default: throw new Error(`TODO: unsupported param in ${param.in}`);
          }
        }

        if (givenParams.size > 0) {
          throw new Error(`Received extra unrecognized params: ${JSON.stringify([...givenParams])}`);
        }
        // console.log(url.toString());

        const sentAt = new Date();
        await context.with(traceCtx, () => opts.engine.mutateEntity<RestCallEntity>(
          'manifest-runtime.dist.app/v1alpha1', 'RestCall',
          restCall.metadata.namespace, restCall.metadata.name,
          cb => {
            cb.status = {
              phase: 'Inflight',
              sentAt, // TODO: rename startedAt
            };
          }));

        try {
          const resp = await context.with(traceCtx, () =>
            fetch(url, {
              method: 'GET',
            }));
          console.log('HTTP', resp.status, 'from', operation.method, url.toString());

          const data = await resp.text();

          await context.with(traceCtx, () =>opts.engine.mutateEntity<RestCallEntity>(
            'manifest-runtime.dist.app/v1alpha1', 'RestCall',
            restCall.metadata.namespace, restCall.metadata.name,
            cb => {
              cb.status = {
                phase: 'Completed',
                sentAt, // TODO: rename startedAt
                response: {
                  statusCode: resp.status,
                  contentType: resp.headers.get('content-type') ?? undefined,
                  data,
                },
              };
            }));

        } catch (thrown) {
          const err = thrown as Error;

          await context.with(traceCtx, () => opts.engine.mutateEntity<RestCallEntity>(
            'manifest-runtime.dist.app/v1alpha1', 'RestCall',
            restCall.metadata.namespace, restCall.metadata.name,
            cb => {
              cb.status = {
                phase: 'Failed',
                sentAt, // TODO: rename startedAt
                error: {
                  code: err.name,
                  message: err.message,
                },
              };
            }));

        }
      }
    }));
  });
}
