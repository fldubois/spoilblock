'use strict';

const ajv     = require('ajv')({allErrors: true});
const express = require('express');
const uuid    = require('uuid');

const db = require('../common/database');

const schema = require('../schemas/spoiler.json');

const router = express.Router();

db.createIndex({
  index: {fields: ['domain']}
});

router.get('/', function (req, res) {
  db.find({
    selector: {
      domain: req.query.domain
    },
    fields: [
      'domain',
      'url',
      'selector'
    ]
  }).then(function (result) {
    return res.status(200).json(result.docs);
  }).catch(function (error) {
    logger.error(error);

    return res.status(500).json({
      error:   error.name,
      message: error.message
    });
  });
});

router.post('/', function (req, res) {
  const logger = req.logger.child({ns: 'spoilers'});

  if (!ajv.validate(schema, req.body)) {
    const errors = ajv.errorsText(ajv.errors, {dataVar: 'Spoiler', separator: '|'}).split('|');

    logger.error({
      doc:    req.body,
      errors: errors
    }, 'Badly formatted spoiler');

    return res.status(400).json({
      error:    'ValidationError',
      messages: errors
    });
  }

  db.find({
    selector: {
      domain:   req.body.domain,
      selector: req.body.selector
    }
  }).then(function (result) {
    if (result.docs.length > 0) {
      logger.error({doc: req.body}, 'Spoiler conflict');

      return res.status(409).json({
        error:   'Conflict',
        message: 'A spoiler with this combination of domain and selector already exists'
      });
    }

    const doc = Object.assign({_id: uuid.v4()}, req.body);

    return db.put(doc).then((result) => {
      logger.info({doc: doc}, 'Spoiler created');

      return res.status(200).json(doc);
    });
  }).catch(function (error) {
    logger.error(error);

    return res.status(500).json({
      error:   error.name,
      message: error.message
    });
  });
});

module.exports = router;

