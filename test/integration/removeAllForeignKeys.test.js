'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const ColTypes = MySQLPlus.ColTypes;

describe('when migrating a table with foreign keys to having no foreign keys', function() {

  const pool = MySQLPlus.createPool(config);
  const pool2 = MySQLPlus.createPool(config);

  pool.defineTable('remove_all_foreign_keys_foreign', {
    columns: {
      id: ColTypes.int().notNull().primaryKey(),
    },
  });
  pool.defineTable('remove_all_foreign_keys_main', {
    columns: {
      id: ColTypes.int().notNull().index(),
    },
    foreignKeys: {
      id: 'remove_all_foreign_keys_foreign.id',
    },
  });
  pool2.defineTable('remove_all_foreign_keys_main', {
    columns: {
      id: ColTypes.int().notNull().index(),
    },
  });

  before(done => {
    pool.sync(err => {
      if (err) {
        throw err;
      }

      pool.end(done);
    });
  });

  after(done => {
    pool2.end(done);
  });

  it('should not error', done => {
    pool2.sync(done);
  });

});
