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

const disable = function (event) {
  if (active !== null && (typeof event === 'undefined' || event.tabId === active.id)) {
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

browser.runtime.onMessage.addListener((message, sender, reply) => {
  if (typeof message === 'object') {
    switch (message.action) {
      case 'selector:enable':
        enable();
        break;
      case 'selector:disable':
        disable();
        break;
      case 'action:show':
        if (typeof sender.tab === 'object' && sender.tab.active === true) {
          browser.pageAction.show(sender.tab.id);

          actions[sender.tab.id] = true;
        }
        break;
      case 'selector:capture':
        browser.tabs.captureVisibleTab().then((dataUrl) => {
          reply();

          return browser.windows.create({
            url:    browser.extension.getURL('html/report.html'),
            type:   'popup',
            width:  message.rect.width,
            height: message.rect.height
          }).then((window) => {
            const tabId = window.tabs[0].id;

            const handler = (details) => {
              if (details.tabId === tabId) {
                browser.tabs.sendMessage(tabId, {
                  action:   'report:show',
                  dataUrl:  dataUrl,
                  selector: message.selector,
                  rect:     message.rect
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
        }).catch((error) => {
          console.error(error);
        });

        return true;
      case 'report:validate':
        browser.tabs.sendMessage(active.id, {action: 'selector:report'});
        break;
      case 'report:cancel':
        browser.tabs.sendMessage(active.id, {action: 'selector:cancel'});
        break;
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

browser.tabs.onActivated.addListener(disable);
browser.webNavigation.onBeforeNavigate.addListener(disable);

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
