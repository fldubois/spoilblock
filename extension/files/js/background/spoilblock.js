'use strict';

// Messages handlers

browser.runtime.onMessage.addListener((message, sender) => {
  if (typeof message === 'object') {
    switch (message.action) {
      case 'action:hide':      return Spoilblock.action.hide(sender.tab);
      case 'action:show':      return Spoilblock.action.show(sender.tab);
      case 'api:get':          return Spoilblock.api.getUrl();
      case 'api:reset':        return Spoilblock.api.setUrl(DEFAULT_URL);
      case 'api:set':          return Spoilblock.api.setUrl(message.value);
      case 'report:cancel':    return Spoilblock.report.cancel();
      case 'report:validate':  return Spoilblock.report.validate(message.selector);
      case 'selector:capture': return Spoilblock.selector.capture(message.selector, message.rect);
      case 'selector:disable': return Spoilblock.selector.disable();
      case 'selector:enable':  return Spoilblock.selector.enable();
      case 'spoilers:count':   return Spoilblock.spoilers.count();
    }
  }

  return false;
});

// Browser action

browser.pageAction.onClicked.addListener(Spoilblock.action.toggle);

// Selector

browser.commands.onCommand.addListener((command) => {
  if (command === 'report') {
    Spoilblock.selector.toggle();
  }
});

browser.tabs.onActivated.addListener(Spoilblock.selector.disable);
browser.webNavigation.onBeforeNavigate.addListener(Spoilblock.selector.disable);

// Report

browser.windows.onRemoved.addListener((id) => {
  if (Spoilblock.report.popup === id) {
    if (Spoilblock.selector.isEnabled()) {
      const tab = Spoilblock.selector.getTab();

      browser.tabs.sendMessage(tab.id, {action: 'selector:cancel'});
    }

    Spoilblock.report.popup = null;
  }
});

// API requests

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
      Spoilblock.toolbar.update(tab.id, tab.url);
    }
  });
});

browser.tabs.onUpdated.addListener((tabId, changes) => {
  if (changes.hasOwnProperty('url')) {
    Spoilblock.toolbar.update(tabId, changes.url);
  }
});

browser.webNavigation.onCommitted.addListener((details) => {
  Spoilblock.toolbar.update(details.tabId, details.url);
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
      const tab = tabs.shift();

      if (typeof tab.url === 'string') {
        Spoilblock.toolbar.update(tab.id, tab.url);
      }
    });
  }
});
