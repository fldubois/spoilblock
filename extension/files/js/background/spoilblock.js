'use strict';

const report = {
  window: null,

  open: function (dataUrl, selector, rect) {
    Promise.all([
      browser.windows.getCurrent({windowTypes: ['normal']}),
      browser.windows.create({
        url:    browser.extension.getURL('html/report.html'),
        type:   'popup',
        width:  rect.width,
        height: rect.height
      })
    ]).then(([window, popup]) => {
      const tabId = popup.tabs[0].id;

      report.window = popup.id;

      const handler = (details) => {
        if (details.tabId === tabId) {
          browser.tabs.sendMessage(tabId, {
            action:   'report:open',
            dataUrl:  dataUrl,
            selector: selector,
            rect:     rect
          }).then((response) => {
            const width  = response.width   + 1;
            const height = response.height  + 1;

            browser.windows.update(popup.id, {
              width:  width,
              height: height,
              left:   Math.round(window.left + (window.width  / 2) - (width  / 2)),
              top:    Math.round(window.top  + (window.height / 2) - (height / 2))
            });
          });

          browser.webNavigation.onCompleted.removeListener(handler);
        }
      };

      browser.webNavigation.onCompleted.addListener(handler);
    });
  },

  close: function () {
    if (report.window === null) {
      return Promise.reject(new Error('Report popup is not open'));
    }

    return  browser.windows.remove(report.window).then(() => {
      report.window = null;
    });
  },

  validate: function (selector) {
    const tab = Spoilblock.selector.getTab();
    const url = new URL(tab.url);

    const spoiler = {
      domain:   url.hostname,
      url:      url.href,
      selector: selector
    };

    return report.close().then(() => {
      return Spoilblock.api.create(spoiler);
    }).then(() => {
      return Promise.all([
        browser.tabs.sendMessage(tab.id, {action: 'selector:disable'}),
        browser.tabs.sendMessage(tab.id, {action: 'spoilers:add', spoiler: spoiler})
      ]);
    });
  },

  cancel: function () {
    return report.close().then(() => {
      return browser.tabs.sendMessage(Spoilblock.selector.getTabId(), {action: 'selector:cancel'});
    });
  }
};

browser.windows.onRemoved.addListener((id) => {
  if (report.window !== null && report.window === id) {
    if (Spoilblock.selector.isActive()) {
      browser.tabs.sendMessage(Spoilblock.selector.getTabId(), {action: 'selector:cancel'});
    }

    report.window = null;
  }
});

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
      case 'report:validate':  return report.validate(message.selector);
      case 'report:cancel':    return report.cancel();
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
