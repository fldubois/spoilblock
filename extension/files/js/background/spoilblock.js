'use strict';

let active = null;

const actions = {}

const enable = function () {
  if (active === null) {
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
      browser.tabs.executeScript(active.id, {file: 'js/content/selector.js'});
    }).catch(console.error);
  }
};

const disable = function () {
  if (active !== null) {
    browser.tabs.sendMessage(active.id, {action: 'selector:disable'});

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
};

browser.runtime.onMessage.addListener((message, sender) => {
  if (typeof message === 'object') {
    if (message.action === 'selector:enable') {
      enable();
    }

    if (message.action === 'selector:disable') {
      disable();
    }

    if (message.action === 'action:show' && typeof sender.tab === 'object' && sender.tab.active === true) {
      browser.pageAction.show(sender.tab.id);

      actions[sender.tab.id] = true;
    }

    if (message.action === 'selector:capture') {
      browser.tabs.captureVisibleTab().then((dataUrl) => {
        browser.tabs.sendMessage(active.id, {action: 'selector:preview', dataUrl: dataUrl});
      }).catch((error) => {
        console.error(error);
      });
    }
  }
});

browser.pageAction.onClicked.addListener((tab) => {
  let action = null;
  let icon   = null;
  let title  = null;

  if (actions[tab.id] === true) {
    title  = browser.i18n.getMessage('pageActionHide');
    icon   = 'icons/logo.svg';
    action = 'spoilers:show';
  } else {
    title  = browser.i18n.getMessage('pageActionShow');
    icon   = 'icons/logo-enabled.svg';
    action = 'spoilers:hide';
  }

  actions[tab.id] = !actions[tab.id];

  browser.pageAction.setTitle({
    tabId: tab.id,
    title: title
  });

  browser.pageAction.setIcon({
    tabId: tab.id,
    path:  {
      '48': icon,
      '96': icon
    }
  });

  browser.tabs.sendMessage(tab.id, {action: action});
});

browser.tabs.onActivated.addListener((infos) => {
  if (active !== null && infos.tabId !== active.id) {
    disable();
  }
});

browser.webNavigation.onCompleted.addListener(function (details) {
  if (active !== null && details.tabId === active.id) {
    disable();
  }

  browser.tabs.executeScript(details.tabId, {file: 'js/content/mask.js'});
});
