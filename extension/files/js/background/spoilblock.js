'use strict';

const API_URL = 'http://localhost:8080/spoilers';

const select = {
  tab: null,

  enable: function () {
    if (select.tab === null) {
      browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        select.tab = tabs.pop();

        browser.browserAction.setIcon({
          tabId: select.tab.id,
          path: {
            '48': 'icons/logo-enabled.svg',
            '96': 'icons/logo-enabled.svg'
          }
        });

        browser.tabs.insertCSS(select.tab.id, {file: 'css/selector.css'});
        browser.tabs.executeScript(select.tab.id, {file: 'js/content/selector.js'});
      }).catch(console.error);
    }
  },

  disable: function (event) {
    if (select.tab !== null && (typeof event === 'undefined' || event.tabId === select.tab.id)) {
      browser.tabs.sendMessage(select.tab.id, {action: 'selector:disable'});

      browser.tabs.removeCSS(select.tab.id, {file: 'css/selector.css'});

      browser.browserAction.setIcon({
        tabId: select.tab.id,
        path: {
          '48': 'icons/logo.svg',
          '96': 'icons/logo.svg'
        }
      });

      select.tab = null;
    }
  },

  capture: function (selector, rect) {
    return browser.tabs.captureVisibleTab().then((dataUrl) => {
      report.show(dataUrl, selector, rect);
    }).catch((error) => {
      console.error(error);
    });
  }
};

const report = {
  show: function (dataUrl, selector, rect) {
    browser.windows.create({
      url:    browser.extension.getURL('html/report.html'),
      type:   'popup',
      width:  rect.width,
      height: rect.height
    }).then((window) => {
      const tabId = window.tabs[0].id;

      const handler = (details) => {
        if (details.tabId === tabId) {
          browser.tabs.sendMessage(tabId, {
            action:   'report:show',
            dataUrl:  dataUrl,
            selector: selector,
            rect:     rect
          }).then((response) => {
            browser.windows.update(window.id, {
              width:  response.width  + 1,
              height: response.height + 1
            });
          });

          browser.webNavigation.onCompleted.removeListener(handler);
        }
      };

      browser.webNavigation.onCompleted.addListener(handler);
    });
  },

  validate: function (selector) {
    const url = new URL(select.tab.url);

    const spoiler = {
      domain:   url.hostname,
      url:      url.href,
      selector: selector
    };

    return api.create(spoiler).then(() => {
      browser.tabs.sendMessage(select.tab.id, {action: 'selector:disable'});
      browser.tabs.sendMessage(select.tab.id, {action: 'spoilers:add', spoiler: spoiler});
    });
  },

  cancel: function () {
    browser.tabs.sendMessage(select.tab.id, {action: 'selector:cancel'});
  }
};

const action = {
  states: [],

  show: function (tab) {
    if (typeof tab === 'object' && tab.active === true) {
      browser.pageAction.show(tab.id);

      action.states[tab.id] = true;
    }
  },

  hide: function (tab) {
    if (typeof tab === 'object' && tab.active === true) {
      browser.pageAction.hide(tab.id);

      action.states[tab.id] = true;
    }
  },

  onClick: function (tab) {
    let message = null;
    let icon    = null;
    let title   = null;

    if (action.states[tab.id] === true) {
      title   = browser.i18n.getMessage('pageActionHide');
      icon    = 'icons/logo.svg';
      message = {action: 'spoilers:show'};
    } else {
      title   = browser.i18n.getMessage('pageActionShow');
      icon    = 'icons/logo-enabled.svg';
      message = {action: 'spoilers:hide'};
    }

    action.states[tab.id] = !action.states[tab.id];

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

    browser.tabs.sendMessage(tab.id, message);
  }
};

const api = {
  retrieve: function (hostname) {
    return fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }).then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        return Promise.reject(new Error(`Fail to retrieve spoilers, API returned status ${response.status}`));
      }
    });
  },

  create: function (data) {
    return fetch(API_URL, {
      method: 'POST',
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
      } else {
        console.log('Fail to create spoiler, API returned status ', response.status);
      }
    }).catch((error) => {
      console.error(error);
    });
  }
};

browser.runtime.onMessage.addListener((message, sender, reply) => {
  if (typeof message === 'object') {
    switch (message.action) {
      case 'selector:enable':  return select.enable();
      case 'selector:disable': return select.disable();
      case 'selector:capture': return select.capture(message.selector, message.rect);
      case 'action:show':      return action.show(sender.tab);
      case 'action:hide':      return action.hide(sender.tab);
      case 'report:validate':  return report.validate(message.selector);
      case 'report:cancel':    return report.cancel();
    }
  }
});

browser.pageAction.onClicked.addListener(action.onClick);

browser.tabs.onActivated.addListener(select.disable);
browser.webNavigation.onBeforeNavigate.addListener(select.disable);

browser.webRequest.onBeforeRequest.addListener(function (details) {
  if (details.type === 'main_frame' && details.method === 'GET') {
    const url = new URL(details.url);

    api.retrieve(url.hostname).then((spoilers) => {
      return browser.storage.local.set({[url.hostname]: spoilers});
    }).catch((error) => {
      console.error(error);
    });
  }
}, {urls:['<all_urls>']}, ['blocking']);
