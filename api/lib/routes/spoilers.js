'use strict';

const ajv     = require('ajv')({allErrors: true});
const express = require('express');
const uuid    = require('uuid');

const db = require('../common/database');

const schema = require('../schemas/spoiler.json');

const router = express.Router();

router.post('/', function (req, res) {
  if (!ajv.validate(schema, req.body)) {
    return res.status(400).json({
      error:    'ValidationError',
      messages: ajv.errors.map((error) => error.message)
    });
  }

  const doc = Object.assign({_id: uuid.v4()}, req.body);

  db.put(doc).then((result) => {
    return res.status(200).json(doc);
  }).catch((error) => {
    return res.status(500).json({
      error:   error.name,
      message: error.message
    });
  });
});

module.exports = router;

