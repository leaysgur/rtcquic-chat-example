import Eve from '../shared/events.js';
import { ab2str, str2ab } from '../shared/utils.js';

// TODO: fix name
export class PeerConnection extends Eve {
  constructor() {
    super();

    this.ice = new RTCIceTransport();
    // eslint-disable-next-line
    this.quic = new RTCQuicTransport(this.ice);

    this.ice.addEventListener('statechange', ev => {
      this.trigger(`ice:${ev.target.state}`);
    });
    this.quic.addEventListener('statechange', ev => {
      this.trigger(`quic:${ev.target.state}`);
    });
    this.quic.addEventListener('quicstream', async ev => {
      const quicStream = ev.stream;

      const CHUNK_SIZE = 256;
      // need to wait first data
      await quicStream.waitForReadable(CHUNK_SIZE);

      let message = '';
      let isAllDataRead = false;
      while (!isAllDataRead) {
        const buffer = new Uint8Array(CHUNK_SIZE);

        const { finished } = quicStream.readInto(buffer);
        message += new TextDecoder().decode(buffer);

        isAllDataRead = finished;
      }

      this.trigger('message', message);
    });
  }

  async createOffer() {
    const { ice, quic } = this;

    await this._gatherAllCandidates();

    return {
      iceParams: ice.getLocalParameters(),
      candidates: ice.getLocalCandidates(),
      key: ab2str(quic.getKey()),
    };
  }
  async setLocalDescAndCreateAnswer(offer) {
    const { ice } = this;

    this.setLocalDesc(offer);

    await this._gatherAllCandidates();

    return {
      iceParams: ice.getLocalParameters(),
      candidates: ice.getLocalCandidates(),
    };
  }

  async setLocalDesc(offer) {
    const { ice, quic } = this;

    for (const candidate of offer.candidates) {
      ice.addRemoteCandidate(new RTCIceCandidate(candidate));
    }

    ice.start(offer.iceParams, 'controlling');
    quic.listen(str2ab(offer.key));
  }

  async setRemoteDesc(answer) {
    const { ice, quic } = this;

    for (const candidate of answer.candidates) {
      ice.addRemoteCandidate(new RTCIceCandidate(candidate));
    }

    ice.start(answer.iceParams, 'controlled');
    quic.connect();
  }

  sendText(text) {
    const { quic } = this;

    const quicStream = quic.createStream();
    quicStream.write({
      data: new TextEncoder().encode(text),
      finish: true,
    });
  }

  _gatherAllCandidates() {
    const ice = this.ice;

    return new Promise((resolve, reject) => {
      ice.addEventListener('icecandidate', ev => {
        if (ev.candidate !== null) {
          return;
        }
        ice.removeEventListener('error', reject);
        resolve();
      });
      ice.addEventListener('error', reject);

      ice.gather({
        gatherPolicy: 'all',
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
    });
  }
}
