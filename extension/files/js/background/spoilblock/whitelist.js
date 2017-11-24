'use strict';

Spoilblock.whitelist = (function () {
  const getKeys = (url) => {
    const parts = new URL(url);

    return {
      page: `toggle:page:${parts.href}`,
      site: `toggle:site:${parts.hostname}`
    };
  };

  return {
    clear: () => {
      return browser.storage.local.get().then((data) => {
        const keys = Object.keys(data).filter((key) => key.startsWith('toggle:'));

        return browser.storage.local.remove(keys);
      });
    },
    get: ({url}) => {
      if (typeof url === 'string') {
        const keys = getKeys(url);

        return browser.storage.local.get({
          [keys.page]: true,
          [keys.site]: true
        }).then((data) => {
          return {
            enabled: data[keys.site] && data[keys.page],
            page:    data[keys.page],
            site:    data[keys.site]
          };
        });
      }

      return browser.storage.local.get().then((data) => {
        const whitelist = {
          sites: [],
          pages: []
        };

        Object.keys(data).forEach((key) => {
          if (key.startsWith('toggle:site') && data[key] === false) {
            whitelist.sites.push(key.replace('toggle:site:', ''));
          }

          if (key.startsWith('toggle:page') && data[key] === false) {
            whitelist.pages.push(key.replace('toggle:page:', ''));
          }
        });

        return whitelist;
      });
    },
    set: ({scope, url, values}) => {
      Spoilblock.events.emit('whitelist:update');

      if (typeof url === 'string') {
        const keys = getKeys(url);

        return browser.storage.local.set({[keys[scope]]: values});
      }

      return browser.storage.local.get().then((data) => {
        const keys = Object.keys(data).filter((key) => key.startsWith(`toggle:${scope}`));

        return browser.storage.local.remove(keys);
      }).then(() => {
        const entries = values.reduce((memo, value) => {
          return Object.assign(memo, {[`toggle:${scope}:${value}`]: false});
        }, {});

        return browser.storage.local.set(entries);
      });
    }
  };
})();
