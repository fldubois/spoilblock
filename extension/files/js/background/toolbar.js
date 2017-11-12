'use strict';

Spoilblock.toolbar = (function () {
  // Methods

  const update = function (tabId, uri) {
    const url = new URL(uri);

    const toggles = [
      'toggle:global',
      `toggle:site:${url.hostname}`,
      `toggle:page:${url.href}`
    ];

    return browser.storage.local.get(toggles).then((data) => {
      const enabled = toggles.reduce((enabled, toggle) => {
        return enabled && (!data.hasOwnProperty(toggle) || data[toggle] === true);
      }, true);

      browser.browserAction.setIcon({
        tabId: tabId,
        path:  enabled ? 'icons/spoilblock.svg' : 'icons/spoilblock-disabled.svg'
      });
    });
  };

  return {
    update
  }
})();
