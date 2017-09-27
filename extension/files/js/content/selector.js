'use strict';

{
  // Set focus

  document.body.setAttribute('tabindex', 0);
  document.body.focus();
  document.body.removeAttribute('tabindex');

  // DOM structure

  const layer = document.createElement('div');

  layer.setAttribute('id', 'spoilblock-select-layer');

  layer.innerHTML = `
    <div id="spoilblock-select-box"></div>
    <div id="spoilblock-select-container">
      <div id="spoilblock-select-popup">
        <h1>${browser.i18n.getMessage('reportTitle')}</h1>
        <canvas id="spoilblock-select-popup-preview" width="0" height="0">
          Spoiler preview
        </canvas>
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
    preview:  layer.querySelector('#spoilblock-select-popup-preview'),
    selector: layer.querySelector('#spoilblock-select-popup-selector'),
    cancel:   layer.querySelector('#spoilblock-select-popup-cancel'),
    report:   layer.querySelector('#spoilblock-select-popup-report')
  };

  const ctx = elements.preview.getContext('2d');

  // Event handlers

  let selector = null;
  let target   = null;

  const stop = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handlers = {
    mouseover: (event) => {
      if (selector === null) {
        target = event.target;

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
        fetch('http://localhost:8080/spoilers', {
          method: 'POST',
          headers: {
            'Accept':       'application/json',
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            domain:   window.location.hostname,
            url:      window.location.href,
            selector: selector
          })
        }).then((response) => {
          if (response.ok) {
            return response.json().then((body) => {
              console.log('Spoiler created', body);
            });
          } else {
            console.log('Fail to create spoiler, API returned status ', response.status);
          }
        }).catch((error) => {
          console.error(error);
        }).then(() => {
          ctx.clearRect(0, 0, elements.preview.width, elements.preview.height);

          elements.preview.setAttribute('width',  0);
          elements.preview.setAttribute('height', 0);

          elements.selector.innerText = '';

          selector = null;

          browser.runtime.sendMessage({action: 'selector:disable'});
        });
      } else if (event.target === elements.cancel) {
        elements.popup.classList.remove('visible');

        ctx.clearRect(0, 0, elements.preview.width, elements.preview.height);

        elements.preview.setAttribute('width',  0);
        elements.preview.setAttribute('height', 0);

        elements.selector.innerText = '';

        selector = null;
      } else {
        selector = createSelector(target);

        layer.style.visibility = 'hidden';

        browser.runtime.sendMessage({action: 'selector:capture'});
      }
    },
    keypress: (event) => {
      if (event.key === 'Escape') {
        browser.runtime.sendMessage({action: 'selector:disable'});
      }
    },
    message: (message) => {
      if (typeof message === 'object') {
        if (message.action === 'selector:disable') {
          document.body.removeChild(layer);

          document.body.removeEventListener('mouseover', handlers.mouseover);
          document.body.removeEventListener('click', handlers.click, true);
          document.body.removeEventListener('keypress', handlers.keypress, true);
          document.body.removeEventListener('dblclick', stop, true);

          browser.runtime.onMessage.removeListener(handlers.message);
        } else if (message.action === 'selector:preview') {
          layer.style.visibility = 'visible';

          const img  = document.createElement('img');
          const rect = target.getBoundingClientRect();

          img.src = message.dataUrl;

          img.onload = function () {
            window.createImageBitmap(this, rect.left, rect.top, rect.width, rect.height).then((bitmap) => {
              elements.preview.setAttribute('width',  rect.width);
              elements.preview.setAttribute('height', rect.height);

              ctx.drawImage(bitmap, 0, 0, rect.width, rect.height);

              elements.selector.innerText = selector;

              elements.popup.classList.add('visible');
            }).catch((error) => {
              console.error(error);
            });
          }

        }
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
