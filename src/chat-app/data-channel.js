import Eve from '../shared/events.js';

export default class DataChannel extends Eve {
  constructor(quic) {
    super();

    this.decoder = new TextDecoder();
    this.encoder = new TextEncoder();

    this.quicStream = quic.createStream();
    // XXX: how to know this stream is for data?
    quic.addEventListener('quicstream', async ev => {
      const quicStream = ev.stream;

      // wait for first message ready
      // 1, minimum value means try to read data A.S.A.P.
      await quicStream.waitForReadable(1);
      this._readData(quicStream);
    });
  }

  sendText(text) {
    const message = this.encoder.encode(text);

    this.quicStream.write({
      data: message,
      finish: false, // keep using this stream
    });
  }

  async _readData(quicStream) {
    const buffer = new Uint8Array(quicStream.readBufferedAmount);

    quicStream.readInto(buffer);
    const message = this.decoder.decode(buffer);
    this.trigger('message', message);

    // wait for next message
    await quicStream.waitForReadable(1);
    this._readData(quicStream);
  }
}
