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
    },
    spoilers: {
      set: (hostname, spoilers) => {
        return browser.storage.local.set({[hostname]: spoilers}).then(() => spoilers);
      },
      get: (hostname) => {
        return browser.storage.local.get({[hostname]: []}).then((data) => data[hostname]);
      }
    },
    toggle: {
      set: (value) => {console.log('toggle.set', value);
        return browser.storage.local.set({'toggle:global': value}).then(() => value);
      },
      get: () => {console.log('toggle.get');
        return browser.storage.local.get({'toggle:global': true}).then((data) => data['toggle:global']);
      }
    }
  };
})();
