import { render, html } from '//unpkg.com/lighterhtml?module';
import PeerConnection from './pc.js';

export default function($root) {
  const refs = {
    pc: null,
    dc: null,
  };

  const state = {
    isSignalingDone: false,
    iceRole: '',
    localSd: '',
    remoteSd: '',

    // after signaling done
    chatText: '',
    messages: [],
  };

  const action = {
    $update(key, val) { state[key] = val; },
    init() {
      refs.pc = new PeerConnection();
      refs.pc.on('quic:connected', action.onQuicConnected);
      refs.pc.on('quic:closed', action.onQuicClosed);
    },
    async getParams() {
      const offer = await refs.pc.createOffer();
      state.localSd = JSON.stringify(offer, null, 2);
      state.iceRole = 'controlling';

      renderView($root, state, action);
    },
    async setParams() {
      // answer side
      if (state.localSd === '' && state.remoteSd !== '') {
        const offer = JSON.parse(state.remoteSd);
        const answer = await refs.pc.setLocalDescAndCreateAnswer(offer);
        state.localSd = JSON.stringify(answer, null, 2);
        state.iceRole = 'controlled';
      }
      // offer side
      else {
        const answer = JSON.parse(state.remoteSd);
        await refs.pc.setRemoteDesc(answer);
      }

      renderView($root, state, action);
    },
    onQuicConnected() {
      state.isSignalingDone = true;
      refs.dc = refs.pc.createDataChannel();
      refs.dc.on('message', action.onDCMessage);

      renderView($root, state, action);
    },
    onQuicClosed() {
      alert('Quic connection closed!');
      location.reload(true);
    },
    onDCMessage({ data }) {
      state.messages.push(data);
      renderView($root, state, action);
    },
    sendText() {
      if (state.chatText.trim().length === 0) {
        return;
      }

      // remote
      refs.dc.sendText(state.chatText);

      // local
      action.onDCMessage({ data: state.chatText });
      state.chatText = '';
      renderView($root, state, action);
    },
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
        <ul>
          ${ state.messages.map(msg => html`
          <li>${msg}</li>
          `)}
        </ul>
        <textarea
          value=${state.chatText}
          oninput=${ev => action.$update('chatText', ev.target.value)}
        ></textarea>
        <button
          type="button"
          onclick=${action.sendText}
        >Send</button>
      ` : html`
        <h3>Signaling</h3>
        <div>
          <h4>Params to send</h4>
          <textarea
            onclick=${ev => ev.target.select()}
            oninput=${ev => action.$update('localSd', ev.target.value)}
          >${state.localSd}</textarea>
          <button
            onclick=${action.getParams}
            disabled=${state.iceRole !== ''}
          >get()</button>
        </div>
        <div>
          <h4>Params to receive</h4>
          <textarea
            onclick=${ev => ev.target.select()}
            oninput=${ev => action.$update('remoteSd', ev.target.value)}
          >${state.remoteSd}</textarea>
          <button
            onclick=${action.setParams}
            disabled=${state.iceRole === 'controlled'}
          >set()</button>
        </div>
      ` }
    </section>
  `);
}
