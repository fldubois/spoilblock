'use strict';

const elements = {
  preview:  document.querySelector('#spoilblock-select-popup-preview'),
  selector: document.querySelector('#spoilblock-select-popup-selector'),
  cancel:   document.querySelector('#spoilblock-select-popup-cancel'),
  report:   document.querySelector('#spoilblock-select-popup-report')
};

const ctx = elements.preview.getContext('2d');

browser.runtime.onMessage.addListener((message) => {
  if (typeof message === 'object' && message.action === 'report:show') {
    const img  = document.createElement('img');
    const rect = message.rect;

    img.src = message.dataUrl;

    return new Promise((resolve, reject) => {
      img.onload = function () {
        window.createImageBitmap(this, rect.left, rect.top, rect.width, rect.height).then((bitmap) => {
          elements.preview.setAttribute('width',  rect.width);
          elements.preview.setAttribute('height', rect.height);

          ctx.drawImage(bitmap, 0, 0, rect.width, rect.height);

          elements.selector.innerText = message.selector;

          const size = document.body.getBoundingClientRect();

          return resolve({
            width:  document.body.scrollWidth,
            height: document.body.scrollHeight
          });
        }).catch((error) => {
          console.error(error);
        });
      }
    });
  }
});

elements.report.addEventListener('click', () => {
  browser.runtime.sendMessage({action: 'report:validate'});
  window.close();
});

elements.cancel.addEventListener('click', () => {
  browser.runtime.sendMessage({action: 'report:cancel'});
  window.close();
});
