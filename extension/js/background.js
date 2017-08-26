'use strict';

let active = null;

const enable = function () {
  browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
    active = tabs.pop();

    browser.browserAction.setIcon({
      tabId: active.id,
      path: {
        '48': 'icons/logo-enabled.svg',
        '96': 'icons/logo-enabled.svg'
      }
    });

    browser.tabs.insertCSS(active.id, {file: 'css/selector.css'});
    browser.tabs.executeScript(active.id, {file: 'js/selector.js'});
  }).catch(console.error);
};

const disable = function () {
  browser.tabs.sendMessage(active.id, {action: 'disable'});

  browser.tabs.removeCSS(active.id, {file: 'css/selector.css'});

  browser.browserAction.setIcon({
    tabId: active.id,
    path: {
      '48': 'icons/logo.svg',
      '96': 'icons/logo.svg'
    }
  });

  active = null;
}

browser.browserAction.onClicked.addListener(() => {
  if (active === null) {
    enable();
  } else {
    disable();
  }
});

browser.tabs.onActivated.addListener((infos) => {
  if (active !== null && infos.tabId !== active.id) {
    disable();
  }
})
