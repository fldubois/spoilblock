'use strict';

const toggles = {
  global: {
    label:    document.querySelector('#s8k-menu-switch-global-label'),
    checkbox: document.querySelector('#s8k-menu-switch-global-checkbox')
  },
  site: {
    label:    document.querySelector('#s8k-menu-switch-site-label'),
    checkbox: document.querySelector('#s8k-menu-switch-site-checkbox')
  },
  page: {
    label:    document.querySelector('#s8k-menu-switch-page-label'),
    checkbox: document.querySelector('#s8k-menu-switch-page-checkbox')
  }
};

const button  = document.querySelector('#s8k-menu-report');
const counter = document.querySelector('#s8k-menu-counter');

// i18n

button.innerText               = browser.i18n.getMessage('popupReport');
toggles.global.label.innerText = browser.i18n.getMessage('popupSwitchGlobal');
toggles.site.label.innerText   = browser.i18n.getMessage('popupSwitchSite');
toggles.page.label.innerText   = browser.i18n.getMessage('popupSwitchPage');
counter.innerText              = browser.i18n.getMessage('popupCounter', 0);

// Global toggle

toggles.global.checkbox.addEventListener('change', () => {
  browser.storage.local.set({'toggle:global': toggles.global.checkbox.checked});
});

browser.storage.local.get('toggle:global').then((data) => {
  toggles.global.checkbox.checked = data.hasOwnProperty('toggle:global') ? data['toggle:global'] : true;
});

browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
  const url = new URL(tabs[0].url);

  const properties = {
    site: `toggle:site:${url.hostname}`,
    page: `toggle:page:${url.href}`
  }

  // Site toggle

  toggles.site.checkbox.addEventListener('change', () => {
    browser.storage.local.set({[properties.site]: toggles.site.checkbox.checked});
  });

  browser.storage.local.get(properties.site).then((data) => {
    toggles.site.checkbox.checked = data.hasOwnProperty(properties.site) ? data[properties.site] : true;
  });

  // Page toggle

  toggles.page.checkbox.addEventListener('change', () => {
    browser.storage.local.set({[properties.page]: toggles.page.checkbox.checked});
  });

  browser.storage.local.get(properties.page).then((data) => {
    toggles.page.checkbox.checked = data.hasOwnProperty(properties.page) ? data[properties.page] : true;
  });
});

// Report button

button.addEventListener('click', () => {
  browser.runtime.sendMessage({action: 'selector:enable'});
  window.close();
});

// Spoilers counter

browser.runtime.sendMessage({action: 'spoilers:count'}).then((count) => {
  counter.innerText = browser.i18n.getMessage('popupCounter', count);
});
