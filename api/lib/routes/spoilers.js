'use strict';

const ajv     = require('ajv')({allErrors: true});
const express = require('express');

const schema = require('../schemas/spoiler.json');

const router = express.Router();

router.post('/', function (req, res) {
  if (!ajv.validate(schema, req.body)) {
    return res.status(400).json({
      error:    'ValidationError',
      messages: ajv.errors.map((error) => error.message)
    });
  }

  res.json(req.body);
});

module.exports = router;

