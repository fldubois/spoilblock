'use strict';

const CLASS_MASKED = 's8k-masked';

const hostname = window.location.hostname;

const toggles = [
  'toggle:global',
  `toggle:site:${hostname}`,
  `toggle:page:${window.location.href}`
];

const spoilers = {
  elements: [],
  enabled:  false,

  init: (spoiler) => {
    const element = document.querySelector(spoiler.selector);

    if (element !== null && spoilers.elements.indexOf(element) === -1) {
      let close = element.querySelector(`.${CLASS_MASKED}-close`);

      if (close === null) {
        close = document.createElement('div');

        close.classList.add(`${CLASS_MASKED}-close`);
        close.innerText = '✖';

        close.addEventListener('click', (event) => {
          if (element.classList.contains(CLASS_MASKED)) {
            event.stopPropagation();
            event.preventDefault();

            element.classList.remove(CLASS_MASKED);
          }
        }, true);

        element.insertBefore(close, element.firstChild);
      }

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

Promise.all([
  browser.runtime.sendMessage({action: 'spoilers:get', hostname: hostname}),
  browser.storage.local.get(toggles)
]).then(([list, data]) => {
  list.forEach(spoilers.init);

  const enabled = toggles.reduce((enabled, toggle) => {
    return enabled && (!data.hasOwnProperty(toggle) || data[toggle] === true);
  }, true);

  spoilers.enabled = enabled;

  if (enabled === true && spoilers.elements.length > 0) {
    spoilers.hide();
    browser.runtime.sendMessage({action: 'action:show'});
  }
});

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
          enabled = enabled && (!data.hasOwnProperty(toggle) || data[toggle] === true);
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
  if (typeof message !== 'object') {
    return false;
  }

  switch (message.action) {
    case 'spoilers:hide':  return spoilers.hide();
    case 'spoilers:show':  return spoilers.show();
    case 'spoilers:count': return spoilers.count();
    case 'spoilers:add':   return spoilers.init(message.spoiler);
    default: return false;
  }
});
