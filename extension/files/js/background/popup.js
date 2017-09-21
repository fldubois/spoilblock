'use strict';

const button = document.querySelector('#spoilblock-popup-report');

button.addEventListener('click', function () {
  browser.runtime.sendMessage({action: 'selector:enable'});
  window.close();
});
