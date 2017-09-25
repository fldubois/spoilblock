'use strict';

const elements = [];

browser.storage.local.get(window.location.hostname).then((data) => {
  const spoilers = data[window.location.hostname];

  if (spoilers.length > 0) {
    spoilers.forEach((spoiler) => {
      var element = document.querySelector(spoiler.selector);

      if (element !== null && elements.indexOf(element) === -1) {
        element.classList.add('spoilblock-masked');

        element.addEventListener('dblclick', function listener(event) {
          event.stopPropagation();
          event.preventDefault();

          element.classList.remove('spoilblock-masked');

          element.removeEventListener('dblclick', listener, true)
        }, true);

        elements.push(element);
      }
    });

    browser.runtime.onMessage.addListener((message) => {
      if (typeof message === 'object') {
        elements.forEach((element) => {
          if (message.action === 'spoilers:hide' && !element.classList.contains('spoilblock-masked')) {
            element.classList.add('spoilblock-masked');
          } else if (message.action === 'spoilers:show' && element.classList.contains('spoilblock-masked')) {
            element.classList.remove('spoilblock-masked');
          }
        });
      }
    });

    browser.runtime.sendMessage({action: 'action:show'});
  }
})
