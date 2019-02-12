import Eve from '../shared/events.js';
import { ab2str, str2ab } from '../shared/utils.js';
import DataChannel from './data-channel.js';

export default class QuicPeerConnection extends Eve {
  constructor() {
    super();

    this.ice = new RTCIceTransport();
    // eslint-disable-next-line
    this.quic = new RTCQuicTransport(this.ice);

    this.quic.addEventListener('statechange', ev => {
      this.trigger(`quic:${ev.target.state}`);
    });
  }

  async getClientParams() {
    // for VanillaICE
    await this._gatherAllCandidates();

    return {
      iceParams: this.ice.getLocalParameters(),
      iceRole: 'controlling',
      candidates: this.ice.getLocalCandidates(),
      key: ab2str(this.quic.getKey()),
    };
  }

  async getServerParams() {
    // for VanillaICE
    await this._gatherAllCandidates();

    return {
      iceParams: this.ice.getLocalParameters(),
      iceRole: 'controlled',
      candidates: this.ice.getLocalCandidates(),
    };
  }

  async setClientParams(params) {
    for (const candidate of params.candidates) {
      this.ice.addRemoteCandidate(new RTCIceCandidate(candidate));
    }

    this.ice.start(params.iceParams, params.iceRole);
    this.quic.listen(str2ab(params.key));
  }

  async setServerParams(params) {
    for (const candidate of params.candidates) {
      this.ice.addRemoteCandidate(new RTCIceCandidate(candidate));
    }

    this.ice.start(params.iceParams, params.iceRole);
    this.quic.connect();
  }

  createDataChannel() {
    const dc = new DataChannel(this.quic);
    return dc;
  }

  _gatherAllCandidates() {
    return new Promise((resolve, reject) => {
      this.ice.addEventListener('icecandidate', ev => {
        if (ev.candidate !== null) {
          return;
        }
        this.ice.removeEventListener('error', reject);
        resolve();
      });
      this.ice.addEventListener('error', reject);

      this.ice.gather({
        gatherPolicy: 'all',
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
    });
  }
}
