'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const {ColTypes} = MySQLPlus;

describe('adding a column before a modified column should work', function() {

  const pool = MySQLPlus.createPool(config);
  const pool2 = MySQLPlus.createPool(config);

  pool.defineTable('add_before_modify', {
    columns: {
      id: ColTypes.int().notNull().primaryKey(),
      modified: ColTypes.int().notNull(),
    },
  });

  pool2.defineTable('add_before_modify', {
    columns: {
      id: ColTypes.int().notNull().primaryKey(),
      added: ColTypes.int().notNull(),
      modified: ColTypes.bigint().notNull(),
    },
  });

  before((done) => {
    pool.sync((err) => {
      if (err) {
        throw err;
      }

      pool.end(done);
    });
  });

  after((done) => {
    pool2.end(done);
  });

  it('should not error', (done) => {
    pool2.sync(done);
  });

});

describe('adding a column before a changed column should work', function() {

  const pool = MySQLPlus.createPool(config);
  const pool2 = MySQLPlus.createPool(config);

  pool.defineTable('add_before_change', {
    columns: {
      id: ColTypes.int().notNull().primaryKey(),
      changed: ColTypes.int().notNull(),
    },
  });

  pool2.defineTable('add_before_change', {
    columns: {
      id: ColTypes.int().notNull().primaryKey(),
      added: ColTypes.int().notNull(),
      changedName: ColTypes.int().notNull().oldName('changed'),
    },
  });

  before((done) => {
    pool.sync((err) => {
      if (err) {
        throw err;
      }

      pool.end(done);
    });
  });

  after((done) => {
    pool2.end(done);
  });

  it('should not error', (done) => {
    pool2.sync(done);
  });

});
