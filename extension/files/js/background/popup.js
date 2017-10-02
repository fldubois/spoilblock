'use strict';

const checkboxes = {
  global: document.querySelector('#spoilblock-popup-switch-global-checkbox'),
  site:   document.querySelector('#spoilblock-popup-switch-site-checkbox')
};

const button = document.querySelector('#spoilblock-popup-report');

// Global checkbox

checkboxes.global.addEventListener('change', function () {
  browser.storage.local.set({'enabled': checkboxes.global.checked});
});

browser.storage.local.get('enabled').then((data) => {
  checkboxes.global.checked = data.hasOwnProperty('enabled') ? data.enabled : true;
});

// Site checkbox

browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
  const url      = new URL(tabs[0].url);
  const property = `toggle:${url.hostname}`;

  checkboxes.site.addEventListener('change', function () {console.log(property, checkboxes.site.checked);
    browser.storage.local.set({[property]: checkboxes.site.checked});
  });

  browser.storage.local.get(property).then((data) => {console.log('data', data);
    checkboxes.site.checked = data.hasOwnProperty(property) ? data[property] : true;
  });
});

// Report button

button.addEventListener('click', function () {
  browser.runtime.sendMessage({action: 'selector:enable'});
  window.close();
});
