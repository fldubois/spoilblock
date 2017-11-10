'use strict';

Spoilblock.selector = (function () {
  let target = null;

  // Methods

  const isEnabled = function () {
    return (target !== null);
  };

  const getTab = function () {
    return isEnabled() ? target : null;
  };

  const enable = function () {
    if (!isEnabled()) {
      browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        target = tabs.pop();

        browser.tabs.insertCSS(target.id, {file: 'css/selector.css'});
        browser.tabs.executeScript(target.id, {file: 'js/content/selector.js'});
      }).catch(console.error);
    }
  };

  const disable = function (event) {
    if (isEnabled() && (typeof event === 'undefined' || event.tabId === target.id)) {
      browser.tabs.sendMessage(target.id, {action: 'selector:disable'});

      browser.tabs.removeCSS(target.id, {file: 'css/selector.css'});

      if (report.window !== null) {
        report.close();
      }

      target = null;
    }
  };

  const toggle = function () {
    if (!isEnabled()) {
      select.enable();
    } else {
      select.disable();
    }
  };

  const capture = function (selector, rect) {
    return browser.tabs.captureVisibleTab().then((dataUrl) => {
      report.open(dataUrl, selector, rect);
    }).catch((error) => {
      console.error(error);
    });
  };


  // Messages handlers

  browser.runtime.onMessage.addListener((message, sender) => {
    if (typeof message === 'object') {
      switch (message.action) {
      case 'selector:enable':  return enable();
      case 'selector:disable': return disable();
      case 'selector:capture': return capture(message.selector, message.rect);
      }
    }

    return false;
  });

  return {
    isEnabled,
    getTab,
    enable,
    disable,
    toggle,
    capture
  }
})();
