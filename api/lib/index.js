'use strict';

const config  = require('config');
const express = require('express');

const pkg = require('../package.json');

const app = express();

app.get('/', (req, res) => {
  res.send(`Spoilblock API v${pkg.version}`);
});

app.listen(config.get('port'), function () {
  console.log(`Spoilblock API listening on port ${config.get('port')}`);
});
