'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const {ColTypes, KeyTypes} = MySQLPlus;

describe('when migrating a table with no foreign keys to having some foreign keys', function() {

  const pool = MySQLPlus.createPool(config);
  const pool2 = MySQLPlus.createPool(config);

  pool.defineTable('add_foreign_keys_foreign', {
    columns: {
      id: ColTypes.int().notNull().primaryKey(),
    },
  });
  pool.defineTable('add_foreign_keys_main', {
    columns: {
      id: ColTypes.int().notNull().index(),
    },
  });
  pool2.defineTable('add_foreign_keys_main', {
    columns: {
      id: ColTypes.int().notNull().index(),
    },
    keys: [
      KeyTypes.foreignKey('id').references('add_foreign_keys_foreign', 'id'),
    ],
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
