'use strict';

const path = require('path');

module.exports = {
  port: 8080,

  database: {
    path: path.resolve(__dirname, '../data/spoilblock')
  }
};
