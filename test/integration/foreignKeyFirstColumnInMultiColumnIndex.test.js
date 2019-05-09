'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const {ColTypes, KeyTypes} = MySQLPlus;

describe('when modifying a column that is part of a foreign key', () => {

  const pool = MySQLPlus.createPool(config);
  const pool2 = MySQLPlus.createPool(config);

  pool.defineTable('table_fk_alter_column', {
    columns: {
      id: ColTypes.int().unsigned().notNull().primaryKey(),
      uid: ColTypes.int().unsigned().notNull().unique(),
    },
  });
  pool2.defineTable('table_fk_alter_column', {
    columns: {
      id: ColTypes.int().unsigned().notNull().primaryKey(),
      uid: ColTypes.bigint().unsigned().notNull().unique(),
    },
  });

  pool.defineTable('table_fk_modify_column_primary_key', {
    columns: {
      id: ColTypes.int().unsigned().notNull().primaryKey(),
    },
    keys: [
      KeyTypes.foreignKey('id').references('table_fk_alter_column', 'id'),
    ],
  });
  pool2.defineTable('table_fk_modify_column_primary_key', {
    columns: {
      id: ColTypes.int().unsigned().notNull().primaryKey().autoIncrement(),
    },
    keys: [
      KeyTypes.foreignKey('id').references('table_fk_alter_column', 'id'),
    ],
  });

  pool.defineTable('table_fk_modify_column_unique_key', {
    columns: {
      uid: ColTypes.int().unsigned().notNull().unique(),
    },
    keys: [
      KeyTypes.foreignKey('uid').references('table_fk_alter_column', 'uid'),
    ],
  });
  pool2.defineTable('table_fk_modify_column_unique_key', {
    columns: {
      uid: ColTypes.bigint().unsigned().notNull().unique(),
    },
    keys: [
      KeyTypes.foreignKey('uid').references('table_fk_alter_column', 'uid'),
    ],
  });

  pool.defineTable('table_fk_modify_column_index_key', {
    columns: {
      uid: ColTypes.int().unsigned().notNull().index(),
    },
    keys: [
      KeyTypes.foreignKey('uid').references('table_fk_alter_column', 'uid'),
    ],
  });
  pool2.defineTable('table_fk_modify_column_index_key', {
    columns: {
      uid: ColTypes.bigint().unsigned().notNull().index(),
    },
    keys: [
      KeyTypes.foreignKey('uid').references('table_fk_alter_column', 'uid'),
    ],
  });

  before((done) => {
    pool.sync((err) => {
      if (err) {
        done(err);
        return;
      }

      pool.end(done);
    });
  });

  after(done => pool2.end(done));

  it('should not error when migrating the table', (done) => {
    pool2.sync(done);
  });

});
