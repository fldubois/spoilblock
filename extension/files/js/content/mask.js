'use strict';

const toggles = [
  'toggle:enabled',
  `toggle:${window.location.hostname}`
];

const spoilers = {
  elements: [],

  init: (spoiler) => {
    var element = document.querySelector(spoiler.selector);

    if (element !== null && spoilers.elements.indexOf(element) === -1) {
      element.addEventListener('dblclick', function listener(event) {
        if (element.classList.contains('spoilblock-masked')) {
          event.stopPropagation();
          event.preventDefault();

          element.classList.remove('spoilblock-masked');
        }
      }, true);

      spoilers.elements.push(element);
    }
  },

  hide: () => {
    spoilers.elements.filter((element) => !element.classList.contains('spoilblock-masked')).forEach((element) => {
      element.classList.add('spoilblock-masked');
    });
  },

  show: () => {
    spoilers.elements.filter((element) => element.classList.contains('spoilblock-masked')).forEach((element) => {
      element.classList.remove('spoilblock-masked');
    });
  }
};

browser.storage.local.get([...toggles, window.location.hostname]).then((data) => {
  const enabled = toggles.reduce((enabled, toggle) => {
    return enabled && (!data.hasOwnProperty(toggle) || data[toggle] === true)
  }, true);

  data[window.location.hostname].forEach(spoilers.init);

  if (enabled === true) {
    spoilers.hide();
    browser.runtime.sendMessage({action: 'action:show'});
  }
})

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    browser.storage.local.get(toggles).then((data) => {
      let changed = false;
      let enabled = true;

      toggles.forEach((toggle) => {
        if (changes.hasOwnProperty(toggle)) {
          changed = true;
          enabled = enabled && changes[toggle].newValue;
        } else {
          enabled = enabled && (!data.hasOwnProperty(toggle) || data[toggle] === true)
        }
      });

      if (changed === true) {
        if (enabled === true) {
          spoilers.hide();
          browser.runtime.sendMessage({action: 'action:show'});
        } else {
          spoilers.show();
          browser.runtime.sendMessage({action: 'action:hide'});
        }
      }
    });
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (typeof message === 'object') {
    switch (message.action) {
      case 'spoilers:hide': return spoilers.hide();
      case 'spoilers:show': return spoilers.show();
    }
  }
});
