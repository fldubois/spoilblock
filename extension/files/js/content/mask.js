'use strict';

const CLASS_MASKED = 's8k-masked';

const toggles = [
  'toggle:enabled',
  `toggle:${window.location.hostname}`
];

const spoilers = {
  elements: [],
  enabled:  false,

  init: (spoiler) => {
    var element = document.querySelector(spoiler.selector);

    if (element !== null && spoilers.elements.indexOf(element) === -1) {
      element.addEventListener('dblclick', function listener(event) {
        if (element.classList.contains(CLASS_MASKED)) {
          event.stopPropagation();
          event.preventDefault();

          element.classList.remove(CLASS_MASKED);
        }
      }, true);

      spoilers.elements.push(element);

      if (spoilers.enabled === true) {
        element.classList.add(CLASS_MASKED);

        if (spoilers.elements.length === 1) {
          browser.runtime.sendMessage({action: 'action:show'});
        }
      }
    }
  },

  count: () => {
    return Promise.resolve(spoilers.elements.length);
  },

  hide: () => {
    spoilers.elements.filter((element) => !element.classList.contains(CLASS_MASKED)).forEach((element) => {
      element.classList.add(CLASS_MASKED);
    });
  },

  show: () => {
    spoilers.elements.filter((element) => element.classList.contains(CLASS_MASKED)).forEach((element) => {
      element.classList.remove(CLASS_MASKED);
    });
  }
};

browser.storage.local.get([...toggles, window.location.hostname]).then((data) => {
  const enabled = toggles.reduce((enabled, toggle) => {
    return enabled && (!data.hasOwnProperty(toggle) || data[toggle] === true)
  }, true);

  data[window.location.hostname].forEach(spoilers.init);

  spoilers.enabled = enabled;

  if (enabled === true && spoilers.elements.length > 0) {
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
        spoilers.enabled = enabled;

        if (enabled === true && spoilers.elements.length > 0) {
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
      case 'spoilers:hide':  return spoilers.hide();
      case 'spoilers:show':  return spoilers.show();
      case 'spoilers:count': return spoilers.count();
      case 'spoilers:add':   return spoilers.init(message.spoiler);
    }
  }
});
