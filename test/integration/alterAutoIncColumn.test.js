'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const ColTypes = MySQLPlus.ColTypes;

describe('when removing or adding the AUTO_INCREMENT attribute from a column', function() {

  const pool = MySQLPlus.createPool(config);
  const pool2 = MySQLPlus.createPool(config);

  pool.defineTable('alter_auto_inc_column', {
    columns: {
      a: ColTypes.int().unsigned().notNull().primaryKey().autoIncrement(),
      b: ColTypes.int().unsigned(),
    },
  });
  pool2.defineTable('alter_auto_inc_column', {
    columns: {
      a: ColTypes.int().unsigned(),
      b: ColTypes.int().unsigned().notNull().index().autoIncrement(),
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

  after(done => pool2.end(done));

  it('should not error when migrating the table', done => {
    pool2.sync(err => {
      if (err) {
        throw err;
      }

      pool2.query('SHOW CREATE TABLE `alter_auto_inc_column`', (err, rows) => {
        if (err) {
          throw err;
        }

        rows[0]['Create Table'].should.equal(
          'CREATE TABLE `alter_auto_inc_column` (\n' +
          '  `a` int(10) unsigned DEFAULT NULL,\n' +
          '  `b` int(10) unsigned NOT NULL AUTO_INCREMENT,\n' +
          '  KEY `index_alter_auto_inc_column_b` (`b`)\n' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
        );
        done();
      });
    });
  });

});
