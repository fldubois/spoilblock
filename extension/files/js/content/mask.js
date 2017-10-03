'use strict';

const elements = [];

const keys = {
  toggle:   `toggle:${window.location.hostname}`,
  hostname: window.location.hostname
};

browser.storage.local.get(['enabled', keys.toggle, keys.hostname]).then((data) => {
  const spoilers = data[keys.hostname];
  const enabled  = (!data.hasOwnProperty('enabled') || data.enabled === true) && (!data.hasOwnProperty(keys.toggle) || data[keys.toggle] === true);

  if (spoilers.length > 0 && enabled) {
    spoilers.forEach((spoiler) => {
      var element = document.querySelector(spoiler.selector);

      if (element !== null && elements.indexOf(element) === -1) {
        element.classList.add('spoilblock-masked');

        element.addEventListener('dblclick', function listener(event) {
          if (element.classList.contains('spoilblock-masked')) {
            event.stopPropagation();
            event.preventDefault();

            element.classList.remove('spoilblock-masked');
          }
        }, true);

        elements.push(element);
      }
    });

    browser.runtime.onMessage.addListener((message) => {
      if (typeof message === 'object') {
        switch (message.action) {
          case 'spoilers:hide':
            elements.filter((element) => !element.classList.contains('spoilblock-masked')).forEach((element) => {
              element.classList.add('spoilblock-masked');
            });
            break;
          case 'spoilers:show':
            elements.filter((element) => element.classList.contains('spoilblock-masked')).forEach((element) => {
              element.classList.remove('spoilblock-masked');
            });
            break;
        }
      }
    });

    browser.runtime.sendMessage({action: 'action:show'});
  }
})
