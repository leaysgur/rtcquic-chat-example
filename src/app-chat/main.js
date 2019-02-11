import { render, html } from '//unpkg.com/lighterhtml?module';

export default function($root, roomName) {
  const refs = {
    pc: null,
  };
  const state = {
    isQuicConnected: false,
  };
  const action = {
    $update(key, val) {
      state[key] = val;
    },
    init() {
      // refs.pc = new PeerConnection();
      // refs.pc.on('quicConnected', () => {
      //   console.warn('!!');
      // });
    },
  };

  console.log(roomName);

  renderView($root, state, action);
}

function renderView($root, state, action) {
  render($root, () => html`
    <h2>QuicChat</h2>
    <section>
      ${ state.isQuicConnected ? html`
        <h3>Chat</h3>
        <p>Yeah!</p>
      ` : html`
        <h3>Signaling<h3>
        <p>...</p>
      ` }
    </section>
  `);
}
