'use strict';

const Spoilblock = {};

Spoilblock.action = (function () {
  let states = [];

  // Methods

  const show = function (tab) {
    if (typeof tab === 'object' && tab.active === true) {
      browser.pageAction.show(tab.id);

      states[tab.id] = true;

      enable(tab);
    }
  };

  const hide = function (tab) {
    if (typeof tab === 'object' && tab.active === true) {
      browser.pageAction.hide(tab.id);
    }
  };

  const update = function (tab, title, icon, message) {
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

    browser.tabs.sendMessage(tab.id, {action: message});
  };

  const enable = function (tab) {
    update(tab, browser.i18n.getMessage('pageActionShow'), 'icons/mask-enabled.svg', 'spoilers:hide');
  };

  const disable = function (tab) {
    update(tab, browser.i18n.getMessage('pageActionHide'), 'icons/mask-disabled.svg', 'spoilers:show');
  };

  const toggle = function (tab) {
    if (states[tab.id] === true) {
      disable(tab);
    } else {
      enable(tab);
    }

    states[tab.id] = !states[tab.id];
  };

  // Messages handlers

  browser.runtime.onMessage.addListener((message, sender) => {
    if (typeof message === 'object') {
      switch (message.action) {
      case 'action:show': return show(sender.tab);
      case 'action:hide': return hide(sender.tab);
      }
    }

    return false;
  });

  return {
    show,
    hide,
    update,
    enable,
    disable,
    toggle
  }
})();
