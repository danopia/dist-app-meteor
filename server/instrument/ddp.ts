import { trace, propagation, ROOT_CONTEXT, SpanKind, SpanStatusCode } from "@opentelemetry/api";

{ // Hook receiving rpcs from the client
  const {protocol_handlers} = MeteorX.Session.prototype;
  const originMethod = protocol_handlers.method;
  const methodtracer = trace.getTracer('ddp.method')
  protocol_handlers.method = function (payload, unblock) {
    if (payload.msg == 'method') {
      const ctx = propagation.extract(ROOT_CONTEXT, payload.baggage ?? {}, {
        get(h,k) { return h[k]; },
        keys(h) { return Object.keys(h); },
      });

      return methodtracer.startActiveSpan(payload.method, {
        kind: SpanKind.SERVER,
        attributes: {
          'rpc.system': 'ddp',
          'rpc.method': payload.method,
          'meteor.user_id': this.userId,
          'ddp.session': this.id,
          'ddp.version': this.version,
          'ddp.method_id': payload.id,
          'net.peer.name': this.socket.remoteAddress,
          'net.peer.port': this.socket.remotePort,
          'net.host.name': this.socket.address.address,
          'net.host.port': this.socket.address.port,
          'net.sock.family': ({'IPv4':'inet','IPv6':'inet6'})[this.socket.address.family] ?? this.socket.address.family,
        },
      }, ctx, () => originMethod.call(this, payload, unblock));
    } else {
      return originMethod.call(this, payload, unblock);
    }
  };
}

{ // Hook responding to RPCs
  const origSend = MeteorX.Session.prototype.send;
  MeteorX.Session.prototype.send = function (payload, ...x) {
    if (payload.msg == 'result') {
      const currentSpan = trace.getActiveSpan();
      if (currentSpan) {
        if (payload.error?.message) {
          currentSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: payload.error.message,
          });
        }
        currentSpan.end();
      }
    }
    return origSend.call(this, payload, ...x);
  }
}
