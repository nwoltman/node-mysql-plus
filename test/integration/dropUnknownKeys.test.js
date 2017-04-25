'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const ColTypes = MySQLPlus.ColTypes;

describe('when migrating a table with keys not created by mysql-plus', function() {

  const pool = MySQLPlus.createPool(config);

  pool.defineTable('unknown_keys', {
    columns: {
      id: ColTypes.int(),
      p: ColTypes.point().notNull(),
    },
    indexes: ['id'],
  });

  before(done => {
    pool.query(
      'CREATE TABLE `unknown_keys` (' +
      '`id` int, ' +
      '`p` point NOT NULL, ' +
      'UNIQUE KEY `unknown_unique_key` (`id`),' +
      'INDEX `unknown_index` (`id`),' +
      'KEY `fk_unknown_keys_id` (`id`),' +
      'SPATIAL KEY `unknown_spatial_key` (`p`))',
      done
    );
  });

  after(done => {
    pool.end(done);
  });

  it('should remove the unknown keys', done => {
    pool.sync(err => {
      if (err) {
        throw err;
      }

      pool.query('SHOW CREATE TABLE `unknown_keys`', (err, rows) => {
        if (err) {
          throw err;
        }

        rows[0]['Create Table'].should.equal(
          'CREATE TABLE `unknown_keys` (\n' +
          '  `id` int(11) DEFAULT NULL,\n' +
          '  `p` point NOT NULL,\n' +
          '  KEY `index_unknown_keys_id` (`id`)\n' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
        );
        done();
      });
    });
  });

});
