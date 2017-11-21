'use strict';

// Messages handlers

const handlers = {
  'action:hide':      ({sender})  => Spoilblock.action.hide(sender.tab),
  'action:show':      ({sender})  => Spoilblock.action.show(sender.tab),
  'api:get':          ()          => Spoilblock.settings.api.get(),
  'api:reset':        ()          => Spoilblock.settings.api.set(Spoilblock.api.DEFAULT_URL),
  'api:set':          ({message}) => Spoilblock.settings.api.set(message.value),
  'toggle:get':       ()          => Spoilblock.settings.toggle.get(),
  'toggle:set':       ({message}) => Spoilblock.settings.toggle.set(message.value),
  'report:cancel':    ()          => Spoilblock.report.cancel(),
  'report:validate':  ({message}) => Spoilblock.report.validate(message.selector),
  'selector:capture': ({message}) => Spoilblock.selector.capture(message.selector, message.rect),
  'selector:disable': ()          => Spoilblock.selector.disable(),
  'selector:enable':  ()          => Spoilblock.selector.enable(),
  'spoilers:count':   ()          => Spoilblock.spoilers.count(),
  'spoilers:get':     ({message}) => Spoilblock.settings.spoilers.get(message.hostname),
  'whitelist:clear':  ()          => Spoilblock.whitelist.clear(),
  'whitelist:get':    ({message}) => Spoilblock.whitelist.get(message),
  'whitelist:set':    ({message}) => Spoilblock.whitelist.set(message)
};

browser.runtime.onMessage.addListener((message, sender) => {
  if (typeof message === 'object' && handlers.hasOwnProperty(message.action)) {
    return handlers[message.action]({message, sender});
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
    const hostname = new URL(details.url).hostname;

    Spoilblock.api.retrieve(hostname).then((spoilers) => {
      return Spoilblock.settings.spoilers.set(hostname, spoilers);
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
