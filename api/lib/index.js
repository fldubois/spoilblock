'use strict';

const config  = require('config');
const express = require('express');

const middlewares = {
  bodyParser: require('body-parser')
};

const pkg = require('../package.json');

const app = express();

app.use(middlewares.bodyParser.json());

app.get('/', (req, res) => {
  res.json({
    name:    pkg.name,
    version: pkg.version
  });
});

app.use('/spoilers', require('./routes/spoilers'));

app.listen(config.get('port'), function () {
  console.log(`Spoilblock API listening on port ${config.get('port')}`);
});
