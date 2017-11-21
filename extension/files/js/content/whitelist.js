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

browser.runtime.sendMessage({action: 'whitelist:get'}).then((whitelist) => {
  elements.sites.input.value = whitelist.sites.join('\n');
  elements.pages.input.value = whitelist.pages.join('\n');
});

// Update

const updateWhitelist = function (scope, values) {
  return browser.runtime.sendMessage({action: 'whitelist:set', scope: scope, values: values}).catch((error) => {
    console.error(error);
  });
};

elements.sites.input.addEventListener('blur', () => {
  updateWhitelist('site', elements.sites.input.value.split('\n'));
});

elements.pages.input.addEventListener('blur', () => {
  updateWhitelist('page', elements.pages.input.value.split('\n'));
});
