'use strict';

Spoilblock.settings = (function () {
  const KEYS = {
    API: 'api:url'
  };

  return {
    api: {
      set: (url) => {
        return browser.storage.local.set({[KEYS.API]: url}).then(() => url);
      },
      get: () => {
        return browser.storage.local.get({[KEYS.API]: Spoilblock.api.DEFAULT_URL}).then((data) => data[KEYS.API]);
      }
    }
  };
})();
