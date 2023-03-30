'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const {ColTypes, KeyTypes} = MySQLPlus;

describe('when migrating a table with supported keys not defined in the schema', function() {

  const pool = MySQLPlus.createPool(config);

  pool.defineTable('other_keys', {
    columns: {
      id: ColTypes.int(),
      p: ColTypes.point().notNull(),
    },
    keys: [
      KeyTypes.index('id'),
    ],
  });

  before((done) => {
    pool.query(
      'CREATE TABLE `other_keys` (' +
      '`id` int, ' +
      '`p` point NOT NULL, ' +
      'UNIQUE KEY `unknown_unique_key` (`id`),' +
      'INDEX `unknown_index` (`id`),' +
      'KEY `fk_other_keys_id` (`id`),' +
      'SPATIAL KEY `unknown_spatial_key` (`p`))',
      done
    );
  });

  after((done) => {
    pool.end(done);
  });

  it('should remove the other keys', (done) => {
    pool.sync((err) => {
      if (err) {
        throw err;
      }

      pool.query('SHOW CREATE TABLE `other_keys`', (err, rows) => {
        if (err) {
          throw err;
        }

        rows[0]['Create Table'].should.equal(
          'CREATE TABLE `other_keys` (\n' +
          '  `id` int DEFAULT NULL,\n' +
          '  `p` point NOT NULL,\n' +
          '  KEY `idx_id` (`id`)\n' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'
        );
        done();
      });
    });
  });

});
