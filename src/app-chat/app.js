import { render, html } from '//unpkg.com/lighterhtml?module';
import { PeerConnection } from './pc.js';

export function initApp($root) {
  const refs = {
    pc: null,
  };

  const state = {
    isSignalingDone: false,
    localSd: '',
    remoteSd: '',
  };

  const action = {
    init() {
      refs.pc = new PeerConnection();
      refs.pc.on('quicConnected', () => {
        console.warn('!!');
      });
    },
    async getParams() {
      const offer = await refs.pc.createOffer();
      state.localSd = JSON.stringify(offer, null, 2);

      renderView($root, state, action);
    },
    async setParams() {
      // answer side
      if (state.localSd === '') {
        const offer = JSON.parse(state.remoteSd);
        const answer = await refs.pc.setLocalDescAndCreateAnswer(offer);
        state.localSd = JSON.stringify(answer, null, 2);
      }
      // offer side
      else {
        const answer = JSON.parse(state.remoteSd);
        await refs.pc.setRemoteDesc(answer);
      }

      renderView($root, state, action);
    },
    $update(key, val) { state[key] = val; }
  };

  action.init();
  renderView($root, state, action);
}

function renderView($root, state, action) {
  render($root, () => html`
    <h2>QuicChat</h2>
    <section>
      ${ state.isSignalingDone ? html`
        <h3>Chat</h3>
        <p>Yeah!</p>
      ` : html`
        <h3>Signaling</h3>
        <div>
          <h4>Params to send</h4>
          <textarea oninput=${ev => action.$update('localSd', ev.target.value)}>${state.localSd}</textarea>
          <button onclick=${action.getParams}>get()</button>
        </div>
        <div>
          <h4>Params to receive</h4>
          <textarea oninput=${ev => action.$update('remoteSd', ev.target.value)}>${state.remoteSd}</textarea>
          <button onclick=${action.setParams}>set()</button>
        </div>
      ` }
    </section>
  `);
}
