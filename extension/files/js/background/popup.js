'use strict';

const switches = {
  global: {
    label:    document.querySelector('#spoilblock-popup-switch-global-label'),
    checkbox: document.querySelector('#spoilblock-popup-switch-global-checkbox')
  },
  site: {
    label:    document.querySelector('#spoilblock-popup-switch-site-label'),
    checkbox: document.querySelector('#spoilblock-popup-switch-site-checkbox')
  }
};

const button  = document.querySelector('#spoilblock-popup-report');
const counter = document.querySelector('#spoilblock-popup-counter');

// i18n

button.innerText                = browser.i18n.getMessage('popupReport');
switches.global.label.innerText = browser.i18n.getMessage('popupSwitchGlobal');
switches.site.label.innerText   = browser.i18n.getMessage('popupSwitchSite');
counter.innerText               = browser.i18n.getMessage('popupCounter', 0);

// Global checkbox

switches.global.checkbox.addEventListener('change', function () {
  browser.storage.local.set({'toggle:enabled': switches.global.checkbox.checked});
});

browser.storage.local.get('toggle:enabled').then((data) => {
  switches.global.checkbox.checked = data.hasOwnProperty('toggle:enabled') ? data['toggle:enabled'] : true;
});

// Site checkbox

browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
  const url      = new URL(tabs[0].url);
  const property = `toggle:${url.hostname}`;

  switches.site.checkbox.addEventListener('change', function () {
    browser.storage.local.set({[property]: switches.site.checkbox.checked});
  });

  browser.storage.local.get(property).then((data) => {
    switches.site.checkbox.checked = data.hasOwnProperty(property) ? data[property] : true;
  });
});

// Report button

button.addEventListener('click', function () {
  browser.runtime.sendMessage({action: 'selector:enable'});
  window.close();
});

// Spoilers counter

browser.runtime.sendMessage({action: 'spoilers:count'}).then((count) => {
  counter.innerText = browser.i18n.getMessage('popupCounter', count);
});
