'use strict';

const toolbar = {
  update: function (tabId, uri) {
    const url = new URL(uri);

    const toggles = [
      'toggle:global',
      `toggle:site:${url.hostname}`,
      `toggle:page:${url.href}`
    ];

    return browser.storage.local.get(toggles).then((data) => {
      const enabled = toggles.reduce((enabled, toggle) => {
        return enabled && (!data.hasOwnProperty(toggle) || data[toggle] === true);
      }, true);

      browser.browserAction.setIcon({
        tabId: tabId,
        path:  enabled ? 'icons/spoilblock.svg' : 'icons/spoilblock-disabled.svg'
      });
    });
  }
};

const action = {
  states: [],

  show: function (tab) {
    if (typeof tab === 'object' && tab.active === true) {
      browser.pageAction.show(tab.id);

      action.states[tab.id] = true;

      action.enable(tab);
    }
  },

  hide: function (tab) {
    if (typeof tab === 'object' && tab.active === true) {
      browser.pageAction.hide(tab.id);
    }
  },

  update: function (tab, title, icon, message) {
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

  enable: function (tab) {
    action.update(tab, browser.i18n.getMessage('pageActionShow'), 'icons/mask-enabled.svg', 'spoilers:hide');
  },

  disable: function (tab) {
    action.update(tab, browser.i18n.getMessage('pageActionHide'), 'icons/mask-disabled.svg', 'spoilers:show');
  },

  toggle: function (tab) {
    if (action.states[tab.id] === true) {
      action.disable(tab);
    } else {
      action.enable(tab);
    }

    action.states[tab.id] = !action.states[tab.id];
  }
};

const spoilers = {
  count: function () {
    return browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
      return browser.tabs.sendMessage(tabs[0].id, {action: 'spoilers:count'});
    });
  }
};

browser.runtime.onMessage.addListener((message, sender) => {
  if (typeof message === 'object') {
    switch (message.action) {
      case 'action:show':      return action.show(sender.tab);
      case 'action:hide':      return action.hide(sender.tab);
      case 'spoilers:count':   return spoilers.count();
    }
  }

  return false;
});

browser.pageAction.onClicked.addListener(action.toggle);

browser.commands.onCommand.addListener((command) => {
  if (command === 'report') {
    Spoilblock.selector.toggle();
  }
});

browser.tabs.onActivated.addListener(Spoilblock.selector.disable);
browser.webNavigation.onBeforeNavigate.addListener(Spoilblock.selector.disable);

browser.webRequest.onBeforeRequest.addListener((details) => {
  if (details.type === 'main_frame' && details.method === 'GET') {
    const url = new URL(details.url);

    Spoilblock.api.retrieve(url.hostname).then((list) => {
      return browser.storage.local.set({[url.hostname]: list});
    }).catch((error) => {
      console.error(error);
    });
  }
}, {urls: ['<all_urls>']}, ['blocking']);

// Toolbar icon

browser.tabs.onActivated.addListener((details) => {
  browser.tabs.get(details.tabId).then((tab) => {
    if (typeof tab.url === 'string') {
      toolbar.update(tab.id, tab.url);
    }
  });
});

browser.tabs.onUpdated.addListener((tabId, changes) => {
  if (changes.hasOwnProperty('url')) {
    toolbar.update(tabId, changes.url);
  }
});

browser.webNavigation.onCommitted.addListener((details) => {
  toolbar.update(details.tabId, details.url);
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
      const tab = tabs.shift();

      if (typeof tab.url === 'string') {
        toolbar.update(tab.id, tab.url);
      }
    });
  }
});
