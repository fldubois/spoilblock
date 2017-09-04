'use strict';

const config = require('config');

const PouchDB = require('pouchdb-node');

const db = new PouchDB(config.get('database.path'));

module.exports = db;
