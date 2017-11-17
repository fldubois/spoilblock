'use strict';

Spoilblock.api = (function () {
  const STORAGE_KEY = 'api:url';
  const DEFAULT_URL = 'http://localhost:8080/spoilers';

  return {
    // Constants

    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_URL: DEFAULT_URL,

    // Methods

    getUrl: () => {
      return browser.storage.local.get({[STORAGE_KEY]: DEFAULT_URL}).then((data) => data[STORAGE_KEY]);
    },

    setUrl: (url) => {
      return browser.storage.local.set({[STORAGE_KEY]: url}).then(() => url);
    },

    retrieve: (hostname) => {
      return Spoilblock.api.getUrl().then((url) => {
        return fetch(`${url}?domain=${hostname}`, {
          method:  'GET',
          headers: {
            'Accept': 'application/json'
          }
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }

          return Promise.reject(new Error(`Fail to retrieve spoilers, API returned status ${response.status}`));
        });
      });
    },

    create: (spoiler) => {
      return Spoilblock.api.getUrl().then((url) => {
        return fetch(url, {
          method:  'POST',
          headers: {
            'Accept':       'application/json',
            'Content-type': 'application/json'
          },
          body: JSON.stringify(spoiler)
        }).then((response) => {
          if (response.ok) {
            return response.json().then((body) => {
              console.log('Spoiler created', body);
            });
          }

          return Promise.reject(new Error(`Fail to create spoiler, API returned status ${response.status}`));
        }).catch((error) => {
          console.error(error);
        });
      });
    }

  };
})();
