import { check, Match } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { ArbitraryEntity } from "/imports/entities/core";
import { FetchRequestEntity } from "/imports/entities/protocol";
import { ApiCredentialEntity, AppInstallationEntity } from "/imports/entities/profile";
import { getUserEngine } from "./entity-engine";
import { ApiBindingEntity } from "/imports/entities/manifest";
import { performHttpRequest } from "/imports/runtime/http-client";
import { trace } from "@opentelemetry/api";

export async function handleCapCall(userId: string | null, entity: ArbitraryEntity) {
  check(entity, {
    kind: String,
    spec: {
      request: Object,
      cap: {
        type: String,
        apiBindingRef: String,
        apiCredentialRef: Match.Optional(String),
        baseUrl: String,
      },
      appInstallationRef: String,
    },
  });
  const request = entity.spec.request as FetchRequestEntity;
  trace.getActiveSpan()?.setAttributes({
    'distapp.cap.type': entity.spec.cap.type,
    'distapp.cap.api_binding.ref': entity.spec.cap.apiBindingRef,
    'distapp.cap.api_credential.ref': entity.spec.cap.apiCredentialRef,
    'distapp.app_install.ref': entity.spec.appInstallationRef,
  });

  const runtime = await getUserEngine(userId);
  const appInstallationNames = entity.spec.appInstallationRef
    .split('/').map(x => decodeURIComponent(x));

  const appInstallation = runtime.getEntity<AppInstallationEntity>('profile.dist.app/v1alpha1', 'AppInstallation', appInstallationNames[0], appInstallationNames[1]);
  if (!appInstallation)
    throw new Meteor.Error(`no-entity`, `AppInstallation not found.`);
  const appNamespace = runtime.useRemoteNamespace(appInstallation.spec.appUri);
  // TODO: seems to be arriving double-encoded?
  let apiBinding = runtime.getEntity<ApiBindingEntity>(
    'manifest.dist.app/v1alpha1', 'ApiBinding',
    appNamespace, decodeURIComponent(entity.spec.cap.apiBindingRef.split('/')[1]));
  if (!apiBinding) {
    // TODO: remove this data race when entities aren't downloaded yet
    await new Promise(ok => setTimeout(ok, 2000));
    apiBinding = runtime.getEntity<ApiBindingEntity>(
      'manifest.dist.app/v1alpha1', 'ApiBinding',
      appNamespace, decodeURIComponent(entity.spec.cap.apiBindingRef.split('/')[1]));
    if (!apiBinding) throw new Meteor.Error(`no-entity`,
      `ApiBinding not found.`);
  }

  const apiCredentialNames = entity.spec.cap.apiCredentialRef
    ?.split('/').map(x => decodeURIComponent(x));
  const apiCredential = apiCredentialNames
    ? runtime.getEntity<ApiCredentialEntity>(
      'profile.dist.app/v1alpha1', 'ApiCredential',
      apiCredentialNames[0], apiCredentialNames[1])
    : null;
  if (entity.spec.cap.apiCredentialRef && !apiCredential) throw new Meteor.Error(`no-entity`,
    `Referenced ApiCredential not found.`);

  const response = await performHttpRequest(runtime, {
    rpc: request,
    apiBindingName: decodeURIComponent(entity.spec.cap.apiBindingRef.split('/')[1]),
    appNamespace: appNamespace,
    apiCredential,
  });
  // console.log('HttpCall', response.spec.status, request.spec.method, request.spec.url);
  return response;

  // console.log('TODO:', {
  //   appInstallation,
  //   appNamespace,
  //   request,
  //   apiBinding,
  //   apiCredential,
  //   cap: entity.spec.cap,
  // });


}
