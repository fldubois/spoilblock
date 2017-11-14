'use strict';

Spoilblock.spoilers = (function () {

  // Methods

  const count = function () {
    return browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
      return browser.tabs.sendMessage(tabs[0].id, {action: 'spoilers:count'});
    });
  };

  // Messages handlers

  browser.runtime.onMessage.addListener((message, sender) => {
    if (typeof message === 'object') {
      switch (message.action) {
        case 'spoilers:count': return count();
      }
    }

    return false;
  });

  return {
    count
  }
})();
