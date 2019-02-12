import { render, html } from '//unpkg.com/lighterhtml?module';
import QuicPeerConnection from './quic-peer-connection.js';

export default function($root) {
  const refs = {
    pc: null,
    dc: null,
  };

  const state = {
    isSignalingDone: false,
    iceRole: '',
    localParams: '',
    remoteParams: '',

    // after signaling done
    chatText: '',
    messages: [],
  };

  const action = {
    $update(key, val) { state[key] = val; },
    init() {
      refs.pc = new QuicPeerConnection();
      refs.pc.on('quic:connected', action.onQuicConnected);
      refs.pc.on('quic:closed', action.onQuicClosed);
    },
    async getParams() {
      const offer = await refs.pc.getClientParams();
      state.localParams = JSON.stringify(offer, null, 2);
      state.iceRole = offer.iceRole;

      renderView($root, state, action);
    },
    async setParams() {
      // answer side
      if (state.localParams === '' && state.remoteParams !== '') {
        const offer = JSON.parse(state.remoteParams);
        await refs.pc.setClientParams(offer);

        const answer = await refs.pc.getServerParams();
        state.localParams = JSON.stringify(answer, null, 2);
        state.iceRole = answer.iceRole;
      }
      // offer side
      else {
        const answer = JSON.parse(state.remoteParams);
        await refs.pc.setServerParams(answer);
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
    <h2 class="header">RTCQuicChat</h2>
    <section>
      ${ state.isSignalingDone
        ? renderChatView(state, action)
        : renderSignalingView(state, action)
      }
    </section>
  `);
}

function renderSignalingView(state, action) {
  return html`
    <h3 class="header">Step1. Signaling</h3>
    <div>
      <h4>Params to send</h4>
      <textarea
        onclick=${ev => ev.target.select()}
        oninput=${ev => action.$update('localParams', ev.target.value)}
        placeholder="Get() it OR paste it from remote peer."
      >${state.localParams}</textarea>
      <button
        class="waves-effect waves-light btn"
        onclick=${action.getParams}
        disabled=${state.iceRole !== ''}
      >get()</button>
    </div>
    <div>
      <h4>Params to receive</h4>
      <textarea
        onclick=${ev => ev.target.select()}
        oninput=${ev => action.$update('remoteParams', ev.target.value)}
        placeholder="Paste it from remote peer, then set() it."
      >${state.remoteParams}</textarea>
      <button
        class="waves-effect waves-light btn"
        onclick=${action.setParams}
        disabled=${state.iceRole === 'controlled'}
      >set()</button>
    </div>
  `;
}
function renderChatView(state, action) {
  return html`
    <h3 class="header">Step2. Chat</h3>
    <ul class="collection">
      ${ state.messages.length === 0 ? html`
      <li class="collection-item grey lighten-4">No messages</li>
      ` : null }
      ${ state.messages.map(msg => html`
      <li class="collection-item">${msg}</li>
      `)}
    </ul>
    <input
      type="text"
      value=${state.chatText}
      oninput=${ev => action.$update('chatText', ev.target.value)}
      placeholder="Enter a message..."
    >
    <button
      class="waves-effect waves-light btn"
      type="button"
      onclick=${action.sendText}
    >Send</button>
  `;
}
