export class MessageHost {
  constructor() {
    const { port1, port2 } = new MessageChannel();
    this.localPort = port1;
    this.remotePort = port2;

    this.localPort.onmessage = this.handleMessage.bind(this);
    // TODO: also messageerror
  }

  private localPort: MessagePort;
  private remotePort: MessagePort | null;

  handleMessage(event: MessageEvent) {
    console.log('MessageHost got message', event.data);
  }

  connectTo(otherWindow: Window) {
    if (!this.remotePort) throw new Error(`BUG: Host was already connected somewhere`);
    otherWindow.postMessage({
      protocol: 'dist.app/v1alpha1',
    }, '*', [this.remotePort]);
    this.remotePort = null;
  }
}
