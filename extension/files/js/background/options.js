'use strict';

const elements = {
  url: {
    input: document.querySelector('#s8k-url-input-text'),
    reset: document.querySelector('#s8k-url-input-reset')
  },
  preferences: {
    clear: document.querySelector('#s8k-preferences-input-clear')
  }
};

browser.runtime.sendMessage({action: 'api:get'}).then((url) => {
  elements.url.input.value = url;
});

elements.url.input.addEventListener('change', () => {
  browser.runtime.sendMessage({action: 'api:set', value: elements.url.input.value});
});

elements.url.reset.addEventListener('click', () => {
  browser.runtime.sendMessage({action: 'api:reset'}).then((url) => {
    elements.url.input.value = url;
  });
});

elements.preferences.clear.addEventListener('click', () => {
  Promise.all([
    browser.runtime.sendMessage({action: 'toggle:set', value: true}),
    browser.runtime.sendMessage({action: 'whitelist:clear'})
  ]);
});
