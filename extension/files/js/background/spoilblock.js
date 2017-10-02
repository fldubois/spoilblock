'use strict';

const selector = {
  tab: null,

  enable: function () {
    if (selector.tab === null) {
      browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        selector.tab = tabs.pop();

        browser.browserAction.setIcon({
          tabId: selector.tab.id,
          path: {
            '48': 'icons/logo-enabled.svg',
            '96': 'icons/logo-enabled.svg'
          }
        });

        browser.tabs.insertCSS(selector.tab.id, {file: 'css/selector.css'});
        browser.tabs.executeScript(selector.tab.id, {file: 'js/content/selector.js'});
      }).catch(console.error);
    }
  },

  disable: function (event) {
    if (selector.tab !== null && (typeof event === 'undefined' || event.tabId === selector.tab.id)) {
      browser.tabs.sendMessage(selector.tab.id, {action: 'selector:disable'});

      browser.tabs.removeCSS(selector.tab.id, {file: 'css/selector.css'});

      browser.browserAction.setIcon({
        tabId: selector.tab.id,
        path: {
          '48': 'icons/logo.svg',
          '96': 'icons/logo.svg'
        }
      });

      selector.tab = null;
    }
  },

  capture: function (selector, rect) {
    return browser.tabs.captureVisibleTab().then((dataUrl) => {
      report.show(dataUrl, selector, rect)
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

  validate: function () {
    browser.tabs.sendMessage(selector.tab.id, {action: 'selector:report'});
  },

  cancel: function () {
    browser.tabs.sendMessage(selector.tab.id, {action: 'selector:cancel'});
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

  onClick: function (tab) {
    let action = null;
    let icon   = null;
    let title  = null;

    if (action.states[tab.id] === true) {
      title  = browser.i18n.getMessage('pageActionHide');
      icon   = 'icons/logo.svg';
      action = 'spoilers:show';
    } else {
      title  = browser.i18n.getMessage('pageActionShow');
      icon   = 'icons/logo-enabled.svg';
      action = 'spoilers:hide';
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

    browser.tabs.sendMessage(tab.id, {action: action});
  }
};

browser.runtime.onMessage.addListener((message, sender, reply) => {
  if (typeof message === 'object') {
    switch (message.action) {
      case 'selector:enable':  return selector.enable();
      case 'selector:disable': return selector.disable();
      case 'selector:capture': return selector.capture(message.selector, message.rect);
      case 'action:show':      return action.show(sender.tab);
      case 'report:validate':  return report.validate();
      case 'report:cancel':    return report.cancel();
    }
  }
});

browser.pageAction.onClicked.addListener(action.onClick);

browser.tabs.onActivated.addListener(selector.disable);
browser.webNavigation.onBeforeNavigate.addListener(selector.disable);

browser.webRequest.onBeforeRequest.addListener(function (details) {
  if (details.type === 'main_frame' && details.method === 'GET') {
    const url = new URL(details.url);
    const xhr = new XMLHttpRequest();

    xhr.open('GET', `http://localhost:8080/spoilers?domain=${url.hostname}`, false);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(null);

    if (xhr.status === 200) {
      const spoilers = JSON.parse(xhr.responseText);

      return browser.storage.local.set({[url.hostname]: spoilers});
    };
  }
}, {urls:['<all_urls>']}, ['blocking']);
