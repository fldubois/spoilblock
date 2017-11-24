'use strict';

const CLASS_MASKED = 's8k-masked';

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

const refresh = () => {
  return Promise.all([
    browser.runtime.sendMessage({action: 'toggle:get'}),
    browser.runtime.sendMessage({action: 'whitelist:get', url: window.location.href})
  ]).then(([toggle, whitelist]) => {
    const enabled = toggle && whitelist.enabled;

    if (enabled === true && spoilers.elements.length > 0) {
      spoilers.hide();
      browser.runtime.sendMessage({action: 'action:show'});
    } else {
      spoilers.show();
      browser.runtime.sendMessage({action: 'action:hide'});
    }

    return enabled;
  });
};

browser.runtime.sendMessage({action: 'spoilers:get', hostname: window.location.hostname}).then((list) => {
  list.forEach(spoilers.init);

  return refresh().then((enabled) => {
    spoilers.enabled = enabled;
  });
});

browser.runtime.onMessage.addListener((message) => {
  if (typeof message !== 'object') {
    return false;
  }

  if (typeof message.event === 'string') {
    if (['toggle:update', 'whitelist:update'].includes(message.event)) {
      return refresh();
    }

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
