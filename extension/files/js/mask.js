'use strict';

const elements = [];

const xhr = new XMLHttpRequest();

xhr.open('GET', `http://localhost:8080/spoilers?domain=${window.location.hostname}`, false);
xhr.setRequestHeader('Content-type', 'application/json');
xhr.send(null);

if (xhr.status === 200) {
  const spoilers = JSON.parse(xhr.responseText);

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
} else {
  console.log('Fail to retrieve spoilers, API returned status ', xhr.status);
}
