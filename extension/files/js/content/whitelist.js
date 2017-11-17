'use strict';

const elements = {
  title: document.querySelector('#s8k-whitelist-title'),
  sites: {
    title: document.querySelector('#s8k-whitelist-sites-title'),
    input: document.querySelector('#s8k-whitelist-sites-input')
  },
  pages: {
    title: document.querySelector('#s8k-whitelist-pages-title'),
    input: document.querySelector('#s8k-whitelist-pages-input')
  }
};

// i18n

elements.title.innerText       = browser.i18n.getMessage('whitelistTitle');
elements.sites.title.innerText = browser.i18n.getMessage('whitelistSites');
elements.pages.title.innerText = browser.i18n.getMessage('whitelistPages');

// Initialization

elements.sites.input.value = '';
elements.pages.input.value = '';

browser.storage.local.get().then((data) => {
  Object.keys(data).forEach((key) => {
    if (key.startsWith('toggle:site') && data[key] === false) {
      elements.sites.input.value += `${key.replace('toggle:site:', '')}\n`;
    }

    if (key.startsWith('toggle:page') && data[key] === false) {
      elements.pages.input.value += `${key.replace('toggle:page:', '')}\n`;
    }
  });
});

// Update

const updateWhitelist = function (scope, values) {
  const toggles = {};

  values.forEach((value) => {
    if (value.length > 0) {
      toggles[`toggle:${scope}:${value}`] = false;
    }
  });

  browser.storage.local.get().then((data) => {
    Object.keys(data).forEach((key) => {
      if (key.startsWith(`toggle:${scope}`)) {
        delete data[key];
      }
    });

    Object.assign(data, toggles);

    return browser.storage.local.clear().then(() => {
      return browser.storage.local.set(data);
    });
  }).catch((error) => {
    console.error(error);
  });
};

elements.sites.input.addEventListener('blur', () => {
  updateWhitelist('site', elements.sites.input.value.split('\n'));
});

elements.pages.input.addEventListener('blur', () => {
  updateWhitelist('page', elements.pages.input.value.split('\n'));
});
