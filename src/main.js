import { isSupportedBrowser, getRoomName } from './shared/utils.js';
import enteranceApp from './app-enterance/main.js';
import chatApp from './app-chat/main.js';

(async function(global) {
  const { document } = global;

  const $root = document.getElementById('js-root');

  const isSupported = isSupportedBrowser(global);
  if (!isSupported) {
    $root.textContent = 'Your browser is not supported!';
    return;
  }

  const roomName = getRoomName(global.location);
  if (roomName !== null) {
    chatApp($root, roomName);
    return;
  }

  enteranceApp($root);
}(window));
