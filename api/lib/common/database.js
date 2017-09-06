'use strict';

const config = require('config');

const PouchDB = require('pouchdb-node');

PouchDB.plugin(require('pouchdb-find'));

const db = new PouchDB(config.get('database.path'));

module.exports = db;
