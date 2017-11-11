'use strict';

Spoilblock.report = (function () {
  let popupId = null;

  // Methods

  const isOpen = function () {
    return (popupId !== null);
  };

  const open = function (dataUrl, selector, rect) {
    Promise.all([
      browser.windows.getCurrent({windowTypes: ['normal']}),
      browser.windows.create({
        url:    browser.extension.getURL('html/report.html'),
        type:   'popup',
        width:  rect.width,
        height: rect.height
      })
    ]).then(([window, popup]) => {
      const tabId = popup.tabs[0].id;

      popupId = popup.id;

      const handler = (details) => {
        if (details.tabId === tabId) {
          browser.tabs.sendMessage(tabId, {
            action:   'report:open',
            dataUrl:  dataUrl,
            selector: selector,
            rect:     rect
          }).then((response) => {
            const width  = response.width   + 1;
            const height = response.height  + 1;

            browser.windows.update(popup.id, {
              width:  width,
              height: height,
              left:   Math.round(window.left + (window.width  / 2) - (width  / 2)),
              top:    Math.round(window.top  + (window.height / 2) - (height / 2))
            });
          });

          browser.webNavigation.onCompleted.removeListener(handler);
        }
      };

      browser.webNavigation.onCompleted.addListener(handler);
    });
  };

  const close = function () {
    if (popupId === null) {
      return Promise.reject(new Error('Report popup is not open'));
    }

    return  browser.windows.remove(popupId).then(() => {
      popupId = null;
    });
  };

  const validate = function (selector) {
    const tab = Spoilblock.selector.getTab();
    const url = new URL(tab.url);

    const spoiler = {
      domain:   url.hostname,
      url:      url.href,
      selector: selector
    };

    return close().then(() => {
      return Spoilblock.api.create(spoiler);
    }).then(() => {
      return Promise.all([
        browser.tabs.sendMessage(tab.id, {action: 'selector:disable'}),
        browser.tabs.sendMessage(tab.id, {action: 'spoilers:add', spoiler: spoiler})
      ]);
    });
  };

  const cancel = function () {
    const tab = Spoilblock.selector.getTab();

    return close().then(() => {
      return browser.tabs.sendMessage(tab.id, {action: 'selector:cancel'});
    });
  };

  // Messages handlers

  browser.runtime.onMessage.addListener((message, sender) => {
    if (typeof message === 'object') {
      switch (message.action) {
      case 'report:validate':  return validate(message.selector);
      case 'report:cancel':    return cancel();
      }
    }

    return false;
  });

  // Browser events

  browser.windows.onRemoved.addListener((id) => {
    const tab = Spoilblock.selector.getTab();

    if (popupId !== null && popupId === id) {
      if (Spoilblock.selector.isEnabled()) {
        browser.tabs.sendMessage(tab.id, {action: 'selector:cancel'});
      }

      popupId = null;
    }
  });

  return {
    open,
    close,
    validate,
    cancel
  }
})();
