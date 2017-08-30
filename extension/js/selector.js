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

  const createSelector = function (element) {
    const selectors = [];

    let current  = element;
    let parent   = current.parentElement;

    selectors.unshift(current.tagName.toLowerCase() + (current.id !== '' ? '#' + current.id : ''));

    while (parent !== null && current.id === '') {
      const siblings = Array.prototype.filter.call(parent.children || [], function (item) {
        return (item.tagName === current.tagName);
      });

      if (siblings.length > 1) {
        let index = 0;

        while (siblings[index] !== current) {
          index++;
        }

        selectors[0] += ':nth-of-type(' + (index + 1) + ')';
      }

      current = parent;
      parent  = current.parentElement;

      selectors.unshift(current.tagName.toLowerCase() + (current.id !== '' ? '#' + current.id : ''));
    };

    return selectors.join(' > ');
  }
}
