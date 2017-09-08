'use strict';

const path = require('path');

module.exports = {
  port: 8080,

  database: {
    path: path.resolve(__dirname, '../data/spoilblock')
  },

  logger: {
    level: 'info',
    path:  path.resolve(__dirname, '../logs')
  }
};
