'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const ColTypes = MySQLPlus.ColTypes;

describe('when altering a multi-column index and the first column in that index has a foreign key', function() {

  this.timeout(5000);

  const pool = MySQLPlus.createPool(config);
  const pool2 = MySQLPlus.createPool(config);

  pool.defineTable('table_fk_index_first_column_a', {
    columns: {
      id: ColTypes.int().unsigned().notNull().primaryKey(),
    },
  });
  pool.defineTable('table_fk_index_first_column_b', {
    columns: {
      id: ColTypes.int().unsigned().notNull().primaryKey(),
    },
  });

  pool.defineTable('table_fk_index_first_column_primary_rename', {
    columns: {
      aID: ColTypes.int().unsigned().notNull(),
      bID: ColTypes.int().unsigned().notNull(),
    },
    primaryKey: ['aID', 'bID'],
    indexes: ['bID'],
    foreignKeys: {
      aID: 'table_fk_index_first_column_a.id',
      bID: 'table_fk_index_first_column_b.id',
    },
  });
  pool2.defineTable('table_fk_index_first_column_primary_rename', {
    columns: {
      aID: ColTypes.int().unsigned().notNull(),
      bIDRenamed: ColTypes.int().unsigned().notNull().oldName('bID'),
    },
    primaryKey: ['aID', 'bIDRenamed'],
    indexes: ['bIDRenamed'],
    foreignKeys: {
      aID: 'table_fk_index_first_column_a.id',
      bIDRenamed: 'table_fk_index_first_column_b.id',
    },
  });

  pool.defineTable('table_fk_index_first_column_unique_rename', {
    columns: {
      aID: ColTypes.int().unsigned().notNull(),
      bID: ColTypes.int().unsigned().notNull(),
    },
    uniqueKeys: [
      ['aID', 'bID'],
    ],
    indexes: ['bID'],
    foreignKeys: {
      aID: 'table_fk_index_first_column_a.id',
      bID: 'table_fk_index_first_column_b.id',
    },
  });
  pool2.defineTable('table_fk_index_first_column_unique_rename', {
    columns: {
      aID: ColTypes.int().unsigned().notNull(),
      bIDRenamed: ColTypes.int().unsigned().notNull().oldName('bID'),
    },
    uniqueKeys: [
      ['aID', 'bIDRenamed'],
    ],
    indexes: ['bIDRenamed'],
    foreignKeys: {
      aID: 'table_fk_index_first_column_a.id',
      bIDRenamed: 'table_fk_index_first_column_b.id',
    },
  });

  pool.defineTable('table_fk_index_first_column_index_rename', {
    columns: {
      aID: ColTypes.int().unsigned().notNull(),
      bID: ColTypes.int().unsigned().notNull(),
    },
    indexes: [
      ['aID', 'bID'],
      'bID',
    ],
    foreignKeys: {
      aID: 'table_fk_index_first_column_a.id',
      bID: 'table_fk_index_first_column_b.id',
    },
  });
  pool2.defineTable('table_fk_index_first_column_index_rename', {
    columns: {
      aID: ColTypes.int().unsigned().notNull(),
      bIDRenamed: ColTypes.int().unsigned().notNull().oldName('bID'),
    },
    indexes: [
      ['aID', 'bIDRenamed'],
      'bIDRenamed',
    ],
    foreignKeys: {
      aID: 'table_fk_index_first_column_a.id',
      bIDRenamed: 'table_fk_index_first_column_b.id',
    },
  });

  pool.defineTable('table_fk_index_first_column_key_change', {
    columns: {
      aID: ColTypes.int().unsigned().notNull(),
      bID: ColTypes.int().unsigned().notNull(),
    },
    uniqueKeys: [
      ['aID', 'bID'],
    ],
    indexes: ['bID'],
    foreignKeys: {
      aID: 'table_fk_index_first_column_a.id',
      bID: 'table_fk_index_first_column_b.id',
    },
  });
  pool2.defineTable('table_fk_index_first_column_key_change', {
    columns: {
      aID: ColTypes.int().unsigned().notNull(),
      bID: ColTypes.int().unsigned().notNull(),
    },
    indexes: [
      ['aID', 'bID'],
      'bID',
    ],
    foreignKeys: {
      aID: 'table_fk_index_first_column_a.id',
      bID: 'table_fk_index_first_column_b.id',
    },
  });

  before(done => {
    pool.sync(err => {
      if (err) {
        done(err);
        return;
      }

      pool.end(done);
    });
  });

  after(done => pool2.end(done));

  it('should not error when migrating the table', done => {
    pool2.sync(done);
  });

});
