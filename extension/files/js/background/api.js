'use strict';

Spoilblock.api = (function () {
  // Constants

  const STORAGE_KEY = 'api:url';
  const DEFAULT_URL = 'http://localhost:8080/spoilers';

  // Methods

  const getUrl = function () {
    return browser.storage.local.get({[STORAGE_KEY]: DEFAULT_URL}).then((data) => data[STORAGE_KEY]);
  };

  const setUrl = function (url) {
    return browser.storage.local.set({[STORAGE_KEY]: url}).then(() => url);
  };

  const retrieve = function (hostname) {
    return getUrl().then((url) => {
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
  };

  const create = function (spoiler) {
    return getUrl().then((url) => {
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
  };

  // Messages handlers

  browser.runtime.onMessage.addListener((message, sender) => {
    if (typeof message === 'object') {
      switch (message.action) {
        case 'api:get':   return Spoilblock.api.getUrl();
        case 'api:set':   return Spoilblock.api.setUrl(message.value);
        case 'api:reset': return Spoilblock.api.setUrl(DEFAULT_URL);
      }
    }

    return false;
  });

  return {
    STORAGE_KEY,
    DEFAULT_URL,
    getUrl,
    setUrl,
    retrieve,
    create
  }
})();
