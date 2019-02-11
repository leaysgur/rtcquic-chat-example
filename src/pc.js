import Eve from './events.js';
import { ab2str, str2ab } from './utils.js';

// TODO: fix name
export class PeerConnection extends Eve {
  constructor() {
    super();

    this.ice = new RTCIceTransport();
    // eslint-disable-next-line
    this.quic = new RTCQuicTransport(this.ice);

    this.ice.addEventListener('statechange', ev => {
      if (ev.target.state === 'connected') {
        this.trigger('iceConnected');
      }
    });
    this.quic.addEventListener('statechange', ev => {
      if (ev.target.state === 'connected') {
        this.trigger('quicConnected');
      }
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

  _gatherAllCandidates() {
    const ice = this.ice;

    return new Promise((resolve, reject) => {
      ice.addEventListener('icecandidate', ev => {
        if (ev.candidate === null) {
          resolve();
        }
      });
      ice.addEventListener('error', ev => reject(ev), { once: true });

      ice.gather({
        gatherPolicy: 'all',
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
    });
  }
}
