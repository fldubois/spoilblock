'use strict';

const checkbox = document.querySelector('#spoilblock-popup-switch-checkbox');
const button   = document.querySelector('#spoilblock-popup-report');

button.addEventListener('click', function () {
  browser.runtime.sendMessage({action: 'selector:enable'});
  window.close();
});

checkbox.addEventListener('change', function () {
  browser.storage.local.set({'enabled': checkbox.checked});
});

browser.storage.local.get('enabled').then((data) => {
  checkbox.checked = data.hasOwnProperty('enabled') ? data.enabled : true;
});
