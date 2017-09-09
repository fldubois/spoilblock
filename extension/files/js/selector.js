'use strict';

{
  // DOM structure

  const select = document.createElement('div');
  const layer  = document.createElement('div');

  select.classList.add('spoilblock-select-box');

  layer.classList.add('spoilblock-select-layer');
  layer.appendChild(select);

  document.body.appendChild(layer);

  // Event handlers

  let target = null;

  const handlers = {
    mouseover: (event) => {
      target  = event.target;

      let display = (target.currentStyle ? target.currentStyle : getComputedStyle(target, null)).display;

      while (display !== 'block') {
        target  = target.parentElement;
        display = (target.currentStyle ? target.currentStyle : getComputedStyle(target, null)).display;
      }

      const rect = target.getBoundingClientRect();

      select.style.top  = (window.scrollY + rect.top)  + 'px';
      select.style.left = (window.scrollX + rect.left) + 'px';

      select.style.width  = rect.width  + 'px';
      select.style.height = rect.height + 'px';
    },
    click: (event) => {
      const selector = createSelector(target);

      var xhr = new XMLHttpRequest();

      xhr.open('POST', 'http://localhost:8080/spoilers', true);

      xhr.setRequestHeader('Content-type', 'application/json');

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          console.log('Spoiler created', JSON.parse(xhr.responseText));
        } else {
          console.log('Fail to create spoiler, API returned status ', xhr.status);
        }
      });

      xhr.addEventListener('error', (event) => {
        console.log('API call error');
      });

      xhr.send(JSON.stringify({
        domain:   window.location.hostname,
        url:      window.location.href,
        selector: selector
      }));

      event.stopPropagation();
      event.preventDefault();
    },
    keypress: (event) => {
      if (event.key === 'Escape') {
        browser.runtime.sendMessage({action: 'disable'});
      }
    },
    message: (message) => {
      if (typeof message === 'object' && message.action === 'disable') {
        document.body.removeChild(layer);

        document.body.removeEventListener('mouseover', handlers.mouseover);
        document.body.removeEventListener('click', handlers.click);

        browser.runtime.onMessage.removeListener(handlers.message);
      }
    }
  }

  document.body.addEventListener('mouseover', handlers.mouseover);
  document.body.addEventListener('click', handlers.click, true);
  document.body.addEventListener('keypress', handlers.keypress, true);

  browser.runtime.onMessage.addListener(handlers.message);

  // Utils

  const createSelector = function (element, selectors = []) {
    const tag = element.tagName.toLowerCase();

    if (tag === 'img') {
      selectors.unshift(`${tag}[src="${element.src}"]`);
    } else if (element.id !== '') {
      selectors.unshift(`${tag}#${element.id}`);
    } else {
      selectors.unshift(tag);

      if (element.parentElement !== null && element.id === '') {
        const siblings = Array.prototype.filter.call(element.parentElement.children || [], function (item) {
          return (item.tagName === element.tagName);
        });

        if (siblings.length > 1) {
          selectors[0] += ':nth-of-type(' + (siblings.indexOf(element) + 1) + ')';
        }

        return createSelector(element.parentElement, selectors);
      };
    }

    return selectors.join(' > ');
  }
}
