import { Meteor } from "meteor/meteor";
import { navigate } from "raviger";

import type { FetchRpcHandler } from "/imports/runtime/FetchRpcHandler";
import type { SavedSessionEntity } from "/imports/entities/profile";
import type { FetchRequestEntity, FetchResponseEntity } from "/imports/entities/protocol";

/**
 * # session.v1alpha1.dist.app
 *
 * This API is used by:
 *   - welcome (bundled app)
 *       Used to show recent sessions to the user
 *       and to request a switch to another session.
 */
export async function serveSessionApi(rpc: {
  request: FetchRequestEntity['spec'];
  path: string;
  context: FetchRpcHandler;
}): Promise<FetchResponseEntity['spec']> {

  if (rpc.path == 'current-user-id' && rpc.request.method == 'GET') {
    const userId = Meteor.userId();
    return {
      status: 200,
      headers: [['content-type', 'text/plain']],
      body: userId ?? '',
    };
  }

  if (rpc.path == 'recent-sessions' && rpc.request.method == 'GET') {
    const sessions = rpc.context.runtime.listEntities<SavedSessionEntity>(
      'profile.dist.app/v1alpha1', 'SavedSession',
      'profile:user');
    return {
      status: 200,
      headers: [['content-type', 'application/json']],
      body: JSON.stringify(sessions),
    };
  }

  const match = new URLPattern({pathname: '/by-name/:sessionName/restore'}).exec(new URL('/'+rpc.path, 'http://null'));
  if (match && rpc.request.method == 'POST') {
    const {sessionName} = match.pathname.groups;
    console.log('restoring SavedSession', sessionName);
    navigate('/desktop/saved-session/'+sessionName);
  }

  return {
    status: 420,
    headers: [['content-type', 'text/plain']],
    body: 'sober up and implement this',
  };
}
