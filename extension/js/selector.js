'use strict';

{
  let layer = document.createElement('div');

  layer.classList.add('spoilblock-select-layer');

  document.body.appendChild(layer);

  browser.runtime.onMessage.addListener((message) => {
    if (typeof message === 'object' && message.action === 'disable') {
      document.body.removeChild(layer);
    }
  });
}
