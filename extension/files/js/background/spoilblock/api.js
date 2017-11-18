'use strict';

Spoilblock.api = (function () {
  const DEFAULT_URL = 'http://localhost:8080/spoilers';

  return {
    // Constants

    DEFAULT_URL: DEFAULT_URL,

    // Methods

    retrieve: (hostname) => {
      return Spoilblock.settings.api.get().then((url) => {
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
      return Spoilblock.settings.api.get().then((url) => {
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
