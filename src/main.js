import { isSupportedBrowser } from './shared/utils.js';
import chatApp from './chat-app/app.js';

(function() {
  const $root = document.getElementById('js-root');

  const isSupported = isSupportedBrowser(window);
  if (!isSupported) {
    $root.textContent = 'Your browser is not supported!';
    return;
  }

  chatApp($root);
}());
