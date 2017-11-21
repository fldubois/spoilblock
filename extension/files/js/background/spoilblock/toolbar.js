'use strict';

Spoilblock.toolbar = (function () {
  return {
    update: (tabId, url) => {
      return Promise.all([
        Spoilblock.settings.toggle.get(),
        Spoilblock.whitelist.get({url: url})
      ]).then(([toggle, whitelist]) => {
        const enabled = toggle && whitelist.enabled;

        browser.browserAction.setIcon({
          tabId: tabId,
          path:  enabled ? 'icons/spoilblock.svg' : 'icons/spoilblock-disabled.svg'
        });
      });
    }
  };
})();
