'use strict';

const elements = [];

const xhr = new XMLHttpRequest();

xhr.open('GET', `http://localhost:8080/spoilers?domain=${window.location.hostname}`, false);
xhr.setRequestHeader('Content-type', 'application/json');
xhr.send(null);

if (xhr.status === 200) {
  const spoilers = JSON.parse(xhr.responseText);

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

} else {
  console.log('Fail to retrieve spoilers, API returned status ', xhr.status);
}
