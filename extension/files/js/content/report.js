'use strict';

const elements = {
  title:    document.querySelector('#s8k-report-title'),
  preview:  document.querySelector('#s8k-report-preview'),
  selector: document.querySelector('#s8k-report-selector'),
  cancel:   document.querySelector('#s8k-report-cancel'),
  confirm:  document.querySelector('#s8k-report-confirm')
};

const ctx = elements.preview.getContext('2d');

// i18n

elements.title.innerText   = browser.i18n.getMessage('reportTitle');
elements.confirm.innerText = browser.i18n.getMessage('reportConfirm');
elements.cancel.innerText  = browser.i18n.getMessage('reportCancel');


browser.runtime.onMessage.addListener((message) => {
  if (typeof message === 'object' && message.action === 'report:open') {
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

elements.confirm.addEventListener('click', () => {
  browser.runtime.sendMessage({action: 'report:validate', selector: elements.selector.innerText});
});

elements.cancel.addEventListener('click', () => {
  browser.runtime.sendMessage({action: 'report:cancel'});
});
