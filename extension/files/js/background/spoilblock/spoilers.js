'use strict';

Spoilblock.spoilers = (function () {
  return {
    count: () => {
      return browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        return browser.tabs.sendMessage(tabs[0].id, {action: 'spoilers:count'});
      });
    }
  }
})();
