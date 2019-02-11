import { isSupportedBrowser } from './utils.js';
import { initApp } from './app.js';

(async function(global) {
  const { document } = global;

  const $root = document.getElementById('js-root');
  const isSupported = isSupportedBrowser(global);

  if (!isSupported) {
    $root.textContent = 'Your browser is not supported!';
    return;
  }

  await initApp($root);
  console.log('App initialized!');
}(window));
