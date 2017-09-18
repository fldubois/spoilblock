'use strict';

{
  // DOM structure

  const layer = document.createElement('div');

  layer.setAttribute('id', 'spoilblock-select-layer');

  layer.innerHTML = `
    <div id="spoilblock-select-box"></div>
    <div id="spoilblock-select-container">
      <div id="spoilblock-select-popup">
        <h1>${browser.i18n.getMessage('reportTitle')}</h1>
        <pre id="spoilblock-select-popup-selector"></pre>
        <div>
          <button id="spoilblock-select-popup-cancel">${browser.i18n.getMessage('reportCancel')}</button>
          <button id="spoilblock-select-popup-report">${browser.i18n.getMessage('reportConfirm')}</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(layer);

  const elements = {
    box:      layer.querySelector('#spoilblock-select-box'),
    popup:    layer.querySelector('#spoilblock-select-popup'),
    selector: layer.querySelector('#spoilblock-select-popup-selector'),
    cancel:   layer.querySelector('#spoilblock-select-popup-cancel'),
    report:   layer.querySelector('#spoilblock-select-popup-report')
  };

  // Event handlers

  let target   = null;
  let selector = null;

  const stop = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handlers = {
    mouseover: (event) => {
      if (!elements.popup.classList.contains('visible')) {
        target  = event.target;

        let display = (target.currentStyle ? target.currentStyle : getComputedStyle(target, null)).display;

        while (display !== 'block') {
          target  = target.parentElement;
          display = (target.currentStyle ? target.currentStyle : getComputedStyle(target, null)).display;
        }

        const rect = target.getBoundingClientRect();

        elements.box.style.top  = (window.scrollY + rect.top)  + 'px';
        elements.box.style.left = (window.scrollX + rect.left) + 'px';

        elements.box.style.width  = rect.width  + 'px';
        elements.box.style.height = rect.height + 'px';
      }
    },
    click: (event) => {
      event.stopPropagation();
      event.preventDefault();

      if (event.target === elements.report) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', 'http://localhost:8080/spoilers', true);

        xhr.setRequestHeader('Content-type', 'application/json');

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            console.log('Spoiler created', JSON.parse(xhr.responseText));
          } else {
            console.log('Fail to create spoiler, API returned status ', xhr.status);
          }

          browser.runtime.sendMessage({action: 'disable'});
        });

        xhr.addEventListener('error', (event) => {
          console.log('API call error');

          browser.runtime.sendMessage({action: 'disable'});
        });

        xhr.send(JSON.stringify({
          domain:   window.location.hostname,
          url:      window.location.href,
          selector: selector
        }));
      } else if (event.target === elements.cancel) {
        elements.popup.classList.remove('visible');
      } else {
        selector = createSelector(target);

        elements.selector.innerText = selector;

        elements.popup.classList.add('visible');
      }
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
        document.body.removeEventListener('click', handlers.click, true);
        document.body.removeEventListener('keypress', handlers.keypress, true);
        document.body.removeEventListener('dblclick', stop, true);

        browser.runtime.onMessage.removeListener(handlers.message);
      }
    }
  }

  document.body.addEventListener('mouseover', handlers.mouseover);
  document.body.addEventListener('click', handlers.click, true);
  document.body.addEventListener('keypress', handlers.keypress, true);
  document.body.addEventListener('dblclick', stop, true);

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
