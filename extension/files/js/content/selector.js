'use strict';

{
  // Set focus

  window.focus();

  // DOM structure

  const layer = document.createElement('div');

  layer.setAttribute('id', 's8k-select-layer');

  layer.innerHTML = `
    <div id="s8k-select-close">✖</div>
    <div id="s8k-select-box"></div>
  `;

  document.body.appendChild(layer);

  const elements = {
    close: layer.querySelector('#s8k-select-close'),
    box:   layer.querySelector('#s8k-select-box')
  };

  // Event handlers

  let selector = null;
  let target   = null;
  let throttle = false;

  const handlers = {
    mouseover: (event) => {
      if (selector === null) {
        target = event.target;

        if (target === elements.close) {
          elements.box.style.top  = '0px';
          elements.box.style.left = '0px';

          elements.box.style.width  = '0px';
          elements.box.style.height = '0px';
        } else {
          let display = (target.currentStyle ? target.currentStyle : getComputedStyle(target, null)).display;

          while (display !== 'block') {
            target  = target.parentElement;
            display = (target.currentStyle ? target.currentStyle : getComputedStyle(target, null)).display;
          }

          const rect = target.getBoundingClientRect();

          elements.box.style.top  = `${rect.top}px`;
          elements.box.style.left = `${rect.left}px`;

          elements.box.style.width  = `${rect.width}px`;
          elements.box.style.height = `${rect.height}px`;
        }
      }
    },
    scroll: () => {
      if (throttle === false) {
        throttle = true;

        window.requestAnimationFrame(() => {
          const rect = target.getBoundingClientRect();

          elements.box.style.top  = `${rect.top}px`;
          elements.box.style.left = `${rect.left}px`;

          throttle = false;
        });
      }
    },
    click: (event) => {
      event.stopPropagation();
      event.preventDefault();

      if (event.target === elements.close) {
        browser.runtime.sendMessage({action: 'selector:disable'});
      } else if (selector === null) {
        selector = createSelector(target);

        layer.style.visibility = 'hidden';

        const rect = target.getBoundingClientRect();

        browser.runtime.sendMessage({
          action:   'selector:capture',
          selector: selector,
          rect:     {
            left:   Math.ceil(rect.left),
            top:    Math.ceil(rect.top),
            width:  Math.ceil(rect.width),
            height: Math.ceil(rect.height)
          }
        }).then(() => {
          layer.style.visibility = 'visible';
        });
      }
    },
    keypress: (event) => {
      if (event.key === 'Escape') {
        browser.runtime.sendMessage({action: 'selector:disable'});
      }
    },
    message: (message) => {
      if (typeof message === 'object') {
        if (message.action === 'selector:cancel') {
          selector = null;
        } else if (message.action === 'selector:disable') {
          document.body.removeChild(layer);

          document.body.removeEventListener('mouseover', handlers.mouseover);
          document.body.removeEventListener('click',     handlers.click,    true);
          document.body.removeEventListener('keypress',  handlers.keypress, true);

          window.removeEventListener('scroll', handlers.scroll);

          browser.runtime.onMessage.removeListener(handlers.message);
        }
      }
    }
  };

  document.body.addEventListener('mouseover', handlers.mouseover);
  document.body.addEventListener('click',     handlers.click,    true);
  document.body.addEventListener('keypress',  handlers.keypress, true);

  window.addEventListener('scroll', handlers.scroll);

  browser.runtime.onMessage.addListener(handlers.message);

  // Utils

  const createSelector = function (element, selectors = []) {
    const tag = element.tagName.toLowerCase();

    if (tag === 'img') {
      selectors.unshift(`${tag}[src="${element.getAttribute('src')}"]`);
    } else if (element.getAttribute('id') !== null) {
      selectors.unshift(`${tag}#${element.getAttribute('id')}`);
    } else {
      selectors.unshift(tag);

      if (element.parentElement !== null) {
        const siblings = Array.prototype.filter.call(element.parentElement.children || [], (item) => {
          return (item.tagName === element.tagName);
        });

        if (siblings.length > 1) {
          selectors[0] += `:nth-of-type(${siblings.indexOf(element) + 1})`;
        }

        return createSelector(element.parentElement, selectors);
      }
    }

    return selectors.join(' > ');
  };
}
