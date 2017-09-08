'use strict';

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
  req.logger = logger.child({req_id: uuid.v4()});

  req.logger.info({req: req});

  onFinished(res, () => {
    const level = (res.statusCode < 400) ? 'info' : 'error';

    req.logger[level]({res: res});
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
