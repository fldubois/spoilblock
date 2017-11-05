'use strict';

const toggles = {
  global: {
    label:    document.querySelector('#s8k-toggle-global > .text'),
    checkbox: document.querySelector('#s8k-toggle-global > .checkbox > input')
  },
  site: {
    label:    document.querySelector('#s8k-toggle-site > .text'),
    checkbox: document.querySelector('#s8k-toggle-site > .checkbox > input')
  },
  page: {
    label:    document.querySelector('#s8k-toggle-page > .text'),
    checkbox: document.querySelector('#s8k-toggle-page > .checkbox > input')
  }
};

const buttons = {
  report:  document.querySelector('#s8k-report'),
  options: document.querySelector('#s8k-options')
};

const counter = document.querySelector('#s8k-counter');

// i18n

buttons.report.innerText       = browser.i18n.getMessage('popupReport');
buttons.options.innerText      = browser.i18n.getMessage('popupOptions');
toggles.global.label.innerText = browser.i18n.getMessage('popupSwitchGlobal');
toggles.site.label.innerText   = browser.i18n.getMessage('popupSwitchSite');
toggles.page.label.innerText   = browser.i18n.getMessage('popupSwitchPage');

// Global toggle

toggles.global.checkbox.addEventListener('change', () => {
  browser.storage.local.set({'toggle:global': toggles.global.checkbox.checked});
});

browser.storage.local.get({'toggle:global': true}).then((data) => {
  toggles.global.checkbox.checked = data['toggle:global'];
});

browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
  const url = new URL(tabs[0].url);

  const properties = {
    site: `toggle:site:${url.hostname}`,
    page: `toggle:page:${url.href}`
  };

  // Site toggle

  toggles.site.checkbox.addEventListener('change', () => {
    browser.storage.local.set({[properties.site]: toggles.site.checkbox.checked});
  });

  browser.storage.local.get({[properties.site]: true}).then((data) => {
    toggles.site.checkbox.checked = data[properties.site];
  });

  // Page toggle

  toggles.page.checkbox.addEventListener('change', () => {
    browser.storage.local.set({[properties.page]: toggles.page.checkbox.checked});
  });

  browser.storage.local.get({[properties.page]: true}).then((data) => {
    toggles.page.checkbox.checked = data[properties.page];
  });
});

// Buttons

buttons.report.addEventListener('click', () => {
  browser.runtime.sendMessage({action: 'selector:enable'});
  window.close();
});

buttons.options.addEventListener('click', () => {
  browser.runtime.openOptionsPage().then(() => {
    window.close();
  }).catch((error) => {
    console.error(error);
  });
});

// Spoilers counter

browser.runtime.sendMessage({action: 'spoilers:count'}).then((count) => {
  counter.innerText = count;
});
