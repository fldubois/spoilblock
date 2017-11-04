'use strict';

const API_URL = 'http://localhost:8080/spoilers';

const elements = {
  url: {
    input: document.querySelector('#s8k-url-input'),
    reset: document.querySelector('#s8k-url-reset')
  }
};

browser.storage.local.get({'api:url': API_URL}).then((data) => {
  elements.url.input.value = data['api:url'];
});

elements.url.input.addEventListener('change', () => {
  console.log('change', elements.url.input.value);
  browser.storage.local.set({'api:url': elements.url.input.value});
});

elements.url.reset.addEventListener('click', () => {
  browser.storage.local.set({'api:url': API_URL}).then(() => {
    elements.url.input.value = API_URL;
  });
});
