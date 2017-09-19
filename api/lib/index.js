'use strict';

const http = require('http');

const config     = require('config');
const express    = require('express');
const onFinished = require('on-finished');
const uuid       = require('uuid');

const middlewares = {
  bodyParser: require('body-parser')
};

const logger = require('./common/logger').child({ns: 'http'});

const pkg = require('../package.json');

const app = express();

app.use(middlewares.bodyParser.json());

app.use((req, res, next) => {
  const start = Date.now();

  req.logger = logger.child({req_id: uuid.v4()});

  req.logger.info({
    event:  'request',
    req:    req,
    params: req.params,
    query:  req.query
  }, `${req.method.toUpperCase()} ${req.originalUrl}`);

  onFinished(res, () => {
    const level = (res.statusCode < 400) ? 'info' : 'error';

    req.logger[level]({
      event:        'response',
      res:          res,
      status:       res.statusCode,
      responseTime: Date.now() - start
    }, `${req.method.toUpperCase()} ${req.originalUrl} - ${res.statusCode} ${http.STATUS_CODES[res.statusCode]}`);
  });

  next();
});

app.get('/', (req, res) => {
  res.json({
    name:    pkg.name,
    version: pkg.version
  });
});

app.use('/spoilers', require('./routes/spoilers'));

app.listen(config.get('port'), function () {
  logger.info(`Spoilblock API listening on port ${config.get('port')}`);
});
