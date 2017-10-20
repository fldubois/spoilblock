'use strict';

const ajv     = require('ajv')({allErrors: true});
const config  = require('config');
const express = require('express');
const uuid    = require('uuid');

const db = require('../common/database');

const schema = require('../schemas/spoiler.json');

const DEFAULT_CACHE = 600;

const HTTP_OK          = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_CONFLICT    = 409;
const HTTP_INTERNAL    = 500;

const router = express.Router();

const cache = config.has('cache') ? config.get('cache') : DEFAULT_CACHE;

db.createIndex({
  index: {fields: ['domain']}
});

router.get('/', (req, res) => {
  const logger = req.logger.child({ns: 'spoilers'});

  db.find({
    selector: {
      domain: req.query.domain
    },
    fields: [
      'domain',
      'url',
      'selector'
    ]
  }).then((result) => {
    return res.status(HTTP_OK).set({
      'Cache-Control': (cache === false) ? 'no-cache, no-store, must-revalidate' : `public, must-revalidate, max-age=${cache}`
    }).json(result.docs);
  }).catch((error) => {
    logger.error(error);

    return res.status(HTTP_INTERNAL).json({
      error:   error.name,
      message: error.message
    });
  });
});

router.post('/', (req, res) => {
  const logger = req.logger.child({ns: 'spoilers'});

  if (!ajv.validate(schema, req.body)) {
    const errors = ajv.errorsText(ajv.errors, {dataVar: 'Spoiler', separator: '|'}).split('|');

    logger.error({
      doc:    req.body,
      errors: errors
    }, 'Badly formatted spoiler');

    return res.status(HTTP_BAD_REQUEST).json({
      error:    'ValidationError',
      messages: errors
    });
  }

  return db.find({
    selector: {
      domain:   req.body.domain,
      selector: req.body.selector
    }
  }).then((result) => {
    if (result.docs.length > 0) {
      logger.error({doc: req.body}, 'Spoiler conflict');

      return res.status(HTTP_CONFLICT).json({
        error:   'Conflict',
        message: 'A spoiler with this combination of domain and selector already exists'
      });
    }

    const doc = Object.assign({_id: uuid.v4()}, req.body);

    return db.put(doc).then(() => {
      logger.info({doc: doc}, 'Spoiler created');

      return res.status(HTTP_OK).json(doc);
    });
  }).catch((error) => {
    logger.error(error);

    return res.status(HTTP_INTERNAL).json({
      error:   error.name,
      message: error.message
    });
  });
});

module.exports = router;

