'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');

const {ColTypes} = MySQLPlus;

describe('when adding new columns', function() {

  const pool = MySQLPlus.createPool(config);
  const pool2 = MySQLPlus.createPool(config);

  pool.defineTable('new_columns_positioning_test', {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.int(),
    },
  });
  pool2.defineTable('new_columns_positioning_test', {
    columns: {
      preA: ColTypes.smallint(),
      a: ColTypes.int(),
      preB: ColTypes.smallint(),
      b: ColTypes.int(),
      c: ColTypes.smallint(),
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

  after(done => pool2.end(done));

  it('should add the columns in the same position that they are defined in the JS columns object', (done) => {
    pool2.sync((err) => {
      if (err) {
        throw err;
      }

      pool2.query('SHOW CREATE TABLE `new_columns_positioning_test`', (err, rows) => {
        if (err) {
          throw err;
        }

        rows[0]['Create Table'].should.equal(
          'CREATE TABLE `new_columns_positioning_test` (\n' +
          '  `preA` smallint DEFAULT NULL,\n' +
          '  `a` int DEFAULT NULL,\n' +
          '  `preB` smallint DEFAULT NULL,\n' +
          '  `b` int DEFAULT NULL,\n' +
          '  `c` smallint DEFAULT NULL\n' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'
        );
        done();
      });
    });
  });

});
