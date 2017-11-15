'use strict';

Spoilblock.selector = (function () {
  let target = null;

  return {
    isEnabled: () => {
      return (target !== null);
    },

    getTab: () => {
      return (target !== null) ? target : null;
    },

    enable: () => {
      if (target === null) {
        browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
          target = tabs.pop();

          browser.tabs.insertCSS(target.id, {file: 'css/selector.css'});
          browser.tabs.executeScript(target.id, {file: 'js/content/selector.js'});
        }).catch(console.error);
      }
    },

    disable: (event) => {
      if (target !== null && (typeof event === 'undefined' || event.tabId === target.id)) {
        browser.tabs.sendMessage(target.id, {action: 'selector:disable'});

        browser.tabs.removeCSS(target.id, {file: 'css/selector.css'});

        if (Spoilblock.report.popup !== null) {
          Spoilblock.report.close();
        }

        target = null;
      }
    },

    toggle: () => {
      if (target === null) {
        Spoilblock.selector.enable();
      } else {
        Spoilblock.selector.disable();
      }
    },

    capture: (selector, rect) => {
      return browser.tabs.captureVisibleTab().then((dataUrl) => {
        Spoilblock.report.open(dataUrl, selector, rect);
      }).catch((error) => {
        console.error(error);
      });
    }
  }
})();
