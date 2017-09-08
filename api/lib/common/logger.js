'use strict';

const path = require('path');

const bunyan = require('bunyan');
const config = require('config');

const pkg = require('../../package.json');

const level = process.env.LOG_LEVEL || (config.has('logger.level') ? config.get('logger.level') : 'info');

module.exports = bunyan.createLogger({
  name:  pkg.name,
  streams: [
    {
      level:  level,
      stream: process.stdout
    },
    {
      level: level,
      path:  path.resolve(config.get('logger.path'), pkg.name + '.log')
    },
    {
      level: 'error',
      path:  path.resolve(config.get('logger.path'), pkg.name + '.error')
    }
  ],
  serializers: bunyan.stdSerializers
});
