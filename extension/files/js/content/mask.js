'use strict';

const elements = [];

browser.storage.local.get(['enabled', `toggle:${window.location.hostname}`, window.location.hostname]).then((data) => {
  const spoilers = data[window.location.hostname];

  if (spoilers.length > 0 && data.enabled && data[`toggle:${window.location.hostname}`]) {
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
