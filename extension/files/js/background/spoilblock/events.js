'use strict';

Spoilblock.events = (function () {
  const handlers = {};

  return {
    emit: (name) => {
      if (handlers.hasOwnProperty(name)) {
        handlers[name].forEach((listener) => {
          listener();
        });
      }

      browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        const tab = tabs.shift();

        if (typeof tab.url === 'string') {
          browser.tabs.sendMessage(tab.id, {event: name});
        }
      });
    },

    on: (name, listener) => {
      if (!handlers.hasOwnProperty(name)) {
        handlers[name] = [];
      }

      handlers[name].push(listener);
    }
  };
})();
