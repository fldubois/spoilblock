'use strict';

const Spoilblock = {};

Spoilblock.action = (function () {
  const states = [];

  return {
    show: (tab) => {
      if (typeof tab === 'object' && tab.active === true) {
        browser.pageAction.show(tab.id);

        states[tab.id] = true;

        Spoilblock.action.enable(tab);
      }
    },

    hide: (tab) => {
      if (typeof tab === 'object' && tab.active === true) {
        browser.pageAction.hide(tab.id);
      }
    },

    update: (tab, title, icon, message) => {
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
    },

    enable: (tab) => {
      Spoilblock.action.update(tab, browser.i18n.getMessage('pageActionShow'), 'icons/mask-enabled.svg', 'spoilers:hide');
    },

    disable: (tab) => {
      Spoilblock.action.update(tab, browser.i18n.getMessage('pageActionHide'), 'icons/mask-disabled.svg', 'spoilers:show');
    },

    toggle: (tab) => {
      if (states[tab.id] === true) {
        Spoilblock.action.disable(tab);
      } else {
        Spoilblock.action.enable(tab);
      }

      states[tab.id] = !states[tab.id];
    }
  };
})();
