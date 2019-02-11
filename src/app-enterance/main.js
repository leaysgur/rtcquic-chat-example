import { render, html } from '//unpkg.com/lighterhtml?module';

export default function($root) {
  const state = {
    roomName: '12345678',
  };
  const action = {
    $update(key, val) {
      state[key] = val;
    },
    onSubmit(ev) {
      ev.preventDefault();
      location.hash = state.roomName;
      location.reload(true);
    },
  };

  renderView($root, state, action);
}

function renderView($root, state, action) {
  render($root, () => html`
    <h2>QuicChat</h2>
    <section>
      <h3>Enter room name(8-digits number)</h3>
      <form action="/" onsubmit=${action.onSubmit}>
        <input
          type="text"
          pattern="^[0-9]{8}$"
          placeholder="12345678"
          value=${state.roomName}
          oninput=${ev => action.$update('roomName', ev.target.value)}
        >
        <button type="submit">Join</button>
      </form>
    </section>
  `);
}
