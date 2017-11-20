'use strict';

Spoilblock.toolbar = (function () {
  return {
    update: (tabId, uri) => {
      const url = new URL(uri);

      const toggles = [
        `toggle:site:${url.hostname}`,
        `toggle:page:${url.href}`
      ];

      return Promise.all([
        Spoilblock.settings.toggle.get(),
        browser.storage.local.get(toggles)
      ]).then(([toggle, data]) => {
        const enabled = toggles.reduce((enabled, toggle) => {
          return enabled && (!data.hasOwnProperty(toggle) || data[toggle] === true);
        }, toggle);

        browser.browserAction.setIcon({
          tabId: tabId,
          path:  enabled ? 'icons/spoilblock.svg' : 'icons/spoilblock-disabled.svg'
        });
      });
    }
  };
})();
