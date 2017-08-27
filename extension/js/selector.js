'use strict';

{
  const select = document.createElement('div');
  const layer  = document.createElement('div');

  select.classList.add('spoilblock-select-box');

  layer.classList.add('spoilblock-select-layer');
  layer.appendChild(select);

  document.body.appendChild(layer);

  document.body.addEventListener('mouseover', function (event) {
    let target  = event.target;
    let display = (target.currentStyle ? target.currentStyle : getComputedStyle(target, null)).display;

    while (display !== 'block') {
      target  = target.parent;
      display = (target.currentStyle ? target.currentStyle : getComputedStyle(target, null)).display;
    }

    const rect = target.getBoundingClientRect();

    select.style.top  = (window.scrollY + rect.top)  + 'px';
    select.style.left = (window.scrollX + rect.left) + 'px';

    select.style.width  = rect.width  + 'px';
    select.style.height = rect.height + 'px';
  });

  browser.runtime.onMessage.addListener((message) => {
    if (typeof message === 'object' && message.action === 'disable') {
      document.body.removeChild(layer);
    }
  });
}
