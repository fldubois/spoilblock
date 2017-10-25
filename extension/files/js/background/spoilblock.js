'use strict';

const API_URL = 'http://localhost:8080/spoilers';

const select = {
  tab: null,

  enable: function () {
    if (select.tab === null) {
      browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        select.tab = tabs.pop();

        browser.tabs.insertCSS(select.tab.id, {file: 'css/selector.css'});
        browser.tabs.executeScript(select.tab.id, {file: 'js/content/selector.js'});
      }).catch(console.error);
    }
  },

  disable: function (event) {
    if (select.tab !== null && (typeof event === 'undefined' || event.tabId === select.tab.id)) {
      browser.tabs.sendMessage(select.tab.id, {action: 'selector:disable'});

      browser.tabs.removeCSS(select.tab.id, {file: 'css/selector.css'});

      if (report.window !== null) {
        report.close();
      }

      select.tab = null;
    }
  },

  toggle: function () {
    if (select.tab === null) {
      select.enable();
    } else {
      select.disable();
    }
  },

  capture: function (selector, rect) {
    return browser.tabs.captureVisibleTab().then((dataUrl) => {
      report.open(dataUrl, selector, rect);
    }).catch((error) => {
      console.error(error);
    });
  }
};

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
    const url = new URL(select.tab.url);

    const spoiler = {
      domain:   url.hostname,
      url:      url.href,
      selector: selector
    };

    return report.close().then(() => {
      return api.create(spoiler);
    }).then(() => {
      return Promise.all([
        browser.tabs.sendMessage(select.tab.id, {action: 'selector:disable'}),
        browser.tabs.sendMessage(select.tab.id, {action: 'spoilers:add', spoiler: spoiler})
      ]);
    });
  },

  cancel: function () {
    return report.close().then(() => {
      return browser.tabs.sendMessage(select.tab.id, {action: 'selector:cancel'});
    });
  }
};

browser.windows.onRemoved.addListener((id) => {
  if (report.window !== null && report.window === id) {
    if (select.tab !== null) {
      browser.tabs.sendMessage(select.tab.id, {action: 'selector:cancel'});
    }

    report.window = null;
  }
});

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
    action.update(tab, browser.i18n.getMessage('pageActionShow'), 'icons/logo-enabled.svg', 'spoilers:hide');
  },

  disable: function (tab) {
    action.update(tab, browser.i18n.getMessage('pageActionHide'), 'icons/logo.svg', 'spoilers:show');
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

const api = {
  retrieve: function (hostname) {
    return fetch(`${API_URL}?domain=${hostname}`, {
      method:  'GET',
      headers: {
        'Accept': 'application/json'
      }
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }

      return Promise.reject(new Error(`Fail to retrieve spoilers, API returned status ${response.status}`));
    });
  },

  create: function (data) {
    return fetch(API_URL, {
      method:  'POST',
      headers: {
        'Accept':       'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then((response) => {
      if (response.ok) {
        return response.json().then((body) => {
          console.log('Spoiler created', body);
        });
      }

      return Promise.reject(new Error(`Fail to create spoiler, API returned status ${response.status}`));
    }).catch((error) => {
      console.error(error);
    });
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
      case 'selector:enable':  return select.enable();
      case 'selector:disable': return select.disable();
      case 'selector:capture': return select.capture(message.selector, message.rect);
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
    select.toggle();
  }
});

browser.tabs.onActivated.addListener(select.disable);
browser.webNavigation.onBeforeNavigate.addListener(select.disable);

browser.webRequest.onBeforeRequest.addListener((details) => {
  if (details.type === 'main_frame' && details.method === 'GET') {
    const url = new URL(details.url);

    api.retrieve(url.hostname).then((list) => {
      return browser.storage.local.set({[url.hostname]: list});
    }).catch((error) => {
      console.error(error);
    });
  }
}, {urls: ['<all_urls>']}, ['blocking']);
