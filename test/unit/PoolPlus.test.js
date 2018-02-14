'use strict';

const ColumnDefinitions = require('../../lib/ColumnDefinitions');
const Connection = require('mysql/lib/Connection');
const MySQLTable = require('../../lib/MySQLTable');
const Pool = require('mysql/lib/Pool');
const PoolPlus = require('../../lib/PoolPlus');
const TableDefinition = require('../../lib/TableDefinition');

const config = require('../config');
const should = require('should');
const sinon = require('sinon');

describe('PoolPlus', () => {

  const pool = new PoolPlus(config);

  const TEST_TABLE_NAME = 'pool_plus_test_table';
  const TEST_TABLE_SCHEMA = {
    columns: {id: pool.ColTypes.bigint().unsigned()},
  };

  after(done => {
    pool.end(done);
  });


  describe('.ColTypes', () => {

    it('should provide the ColumnDefinitions functions', () => {
      pool.ColTypes.should.equal(ColumnDefinitions);
    });

  });


  describe('new', () => {

    it('should construct an instance of a mysql Pool', () => {
      pool.should.be.an.instanceOf(Pool);
    });

    it('should throw if the configured migration strategy is invalid', () => {
      should.throws(
        () => new PoolPlus({plusOptions: {
          migrationStrategy: 'bleh',
        }}),
        /not a valid migration strategy/
      );
    });

  });


  describe('#format()', () => {

    it('should format an SQL string', done => {
      const tempPool = new PoolPlus(config);
      tempPool.format('?? ?', ['a', 'b']).should.equal("`a` 'b'");
      tempPool.end(done);
    });

    it('should format an SQL string with a custom formatter', done => {
      const tempPool = new PoolPlus(Object.assign({queryFormat: sql => sql + '!'}, config));
      tempPool.format('?? ?', ['a', 'b']).should.equal('?? ?!');
      tempPool.end(done);
    });

  });


  describe('#raw()', () => {

    it('should return a "raw" object', () => {
      pool.raw('CURRENT_TIMESTAMP')
        .should.have.type('object')
        .and.have.ownProperty('toSqlString')
        .which.has.type('function');
    });

  });


  describe('#basicTable()', () => {

    it('should return a MySQLTable instance', () => {
      const table = pool.basicTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
      table.should.be.an.instanceOf(MySQLTable);
      table.name.should.equal(TEST_TABLE_NAME);
      should.strictEqual(table.schema, undefined);
      table.pool.should.equal(pool);
    });

    it('should throw if the table name is not a string', () => {
      (() => pool.basicTable()).should.throw(TypeError);
      (() => pool.basicTable()).should.throw(/The table name must be a string/);
      (() => pool.basicTable(/table/)).should.throw(/The table name must be a string/);
    });

  });


  describe('#defineTable()', () => {

    it('should return a MySQLTable instance', () => {
      const table = pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
      table.should.be.an.instanceOf(MySQLTable);
      table.name.should.equal(TEST_TABLE_NAME);
      table.schema.should.equal(TEST_TABLE_SCHEMA);
      table.pool.should.equal(pool);
    });

    it('should throw if no arguments are provided', () => {
      should.throws(() => pool.defineTable(), Error);
    });

    it('should throw if the table name is not a string', () => {
      (() => pool.defineTable(/table/)).should.throw(TypeError);
      (() => pool.defineTable(/table/)).should.throw(/The table name must be a string/);
    });

    it('should throw if no columns are provided', () => {
      should.throws(() => pool.defineTable('table', {}), /must have.*column/);
      should.throws(() => pool.defineTable('table', {columns: {}}), /must have.*column/);
      should.throws(() => pool.defineTable('table', {columns: Object.create(null)}), /must have.*column/);

      function Clazz() { /* constructor */ }
      Clazz.prototype.foo = 1; // So the instance will have enumerable properties but no "own" properties

      should.throws(() => pool.defineTable('table', {columns: new Clazz()}), /must have.*column/);
    });

    it('should throw if the specified migration strategy is invalid', () => {
      should.throws(
        () => pool.defineTable('table', {columns: {id: 1}}, 'bleh'),
        /not a valid migration strategy/
      );
    });

    it('should throw if a table with the given name has already been defined', () => {
      // Was defined in the test above
      should.throws(() => pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA), /already\s.*\s*defined/);
    });

  });


  describe('#sync()', () => {

    it('should sync the defined tables to the database', done => {
      pool.sync(err => {
        if (err) {
          done(err);
          return;
        }
        pool.query(`SHOW CREATE TABLE ${TEST_TABLE_NAME}`, (err, result) => {
          if (err) throw err;
          result[0]['Create Table'].should.equal(
            'CREATE TABLE `' + TEST_TABLE_NAME + '` (\n' +
            '  `id` bigint(20) unsigned DEFAULT NULL\n' +
            ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
          );
          done();
        });
      });
    });

    it('should work if no tables have been added, removed, or changed', done => {
      pool.sync(done);
    });

    it('should work even if no tables have been defined', done => {
      const p = new PoolPlus(config);
      p.sync(err => {
        if (err) throw err;
        p.end(done);
      });
    });

    it('should return a promise if no callback is provided', () => {
      const promise = pool.sync();
      promise.should.be.an.instanceOf(Promise);
      return promise;
    });


    describe('if an error occured getting a connection', () => {

      const error = new Error('test error');

      before(() => {
        sinon.stub(pool, 'getConnection').yieldsAsync(error);
        sinon.stub(TableDefinition.prototype, 'genSyncOperations')
          .yieldsAsync(null, [{sql: 'pretend sql', type: -1}]);
      });

      after(() => {
        pool.getConnection.restore();
        TableDefinition.prototype.genSyncOperations.restore();
      });

      it('should call the callback with an error', done => {
        pool.sync(err => {
          err.should.equal(error);
          done();
        });
      });

      it('should reject the returned promise with an error', () => {
        return pool.sync().catch(err => {
          err.should.equal(error);
        });
      });

    });


    describe('if an error occured getting the sync operations', () => {

      const error = new Error('test error');

      before(() => {
        sinon.stub(TableDefinition.prototype, 'genSyncOperations').yieldsAsync(error);
      });

      after(() => {
        TableDefinition.prototype.genSyncOperations.restore();
      });

      it('should call the callback with an error', done => {
        pool.sync(err => {
          err.should.equal(error);
          done();
        });
      });

      it('should reject the returned promise with an error', () => {
        return pool.sync().catch(err => {
          err.should.equal(error);
        });
      });

    });


    describe('if an error occurs while running the sync operations', () => {

      const error = new Error('test error');

      before(() => {
        sinon.stub(Connection.prototype, 'query').yieldsAsync(error);
        sinon.stub(TableDefinition.prototype, 'genSyncOperations')
          .yieldsAsync(null, [{sql: 'pretend sql', type: -1}, {sql: '', type: 0}]);
      });

      after(() => {
        Connection.prototype.query.restore();
        TableDefinition.prototype.genSyncOperations.restore();
      });

      it('should call the callback with an error', done => {
        pool.sync(err => {
          err.should.equal(error);
          done();
        });
      });

      it('should reject the returned promise with an error', () => {
        return pool.sync().catch(err => {
          err.should.equal(error);
        });
      });

    });

  });


  describe('#pquery()', () => {

    it('should behave like #query() when passed a callback', () => {
      const expectedSql = 'SELECT 1 as ??';
      const expectedValues = ['solution'];
      function expectedCb() { /* no-op */ }

      sinon.stub(pool, 'query').callsFake((sql, values, cb) => {
        sql.should.equal(expectedSql);
        values.should.equal(expectedValues);
        cb.should.equal(expectedCb);
      });

      pool.pquery(expectedSql, expectedValues, expectedCb);
      pool.query.should.be.called();

      pool.query.restore();
    });

    it('should return a working Promise', done => {
      pool.pquery('SELECT "a" as solution')
        .then(results => {
          results.should.have.length(1);
          results[0].solution.should.equal('a');

          pool.pquery('SELECT "a" as ??', ['solution'])
            .then(results2 => {
              results2.should.have.length(1);
              results2[0].solution.should.equal('a');

              pool.pquery('SELECT a as solution')
                .then(() => done(new Error()))
                .catch(() => done());
            })
            .catch(done);
        })
        .catch(done);
    });

  });


  describe('#transaction()', () => {

    describe('with a callback interface', () => {

      before(done => {
        pool.query('CREATE TABLE mysql_plus_transaction_test (id int)', done);
      });

      after(done => {
        pool.query('DROP TABLE mysql_plus_transaction_test', done);
      });

      it('should commit changes if no errors occur', done => {
        pool.transaction((trxn, trxnDone) => {
          trxn.query('INSERT INTO mysql_plus_transaction_test VALUES (1), (2)', (err, result) => {
            if (err) {
              trxnDone(err);
              return;
            }

            result.affectedRows.should.equal(2);

            trxn.query('DELETE FROM mysql_plus_transaction_test WHERE id = 1', (err, result) => {
              if (err) {
                trxnDone(err);
                return;
              }

              result.affectedRows.should.equal(1);

              trxnDone(null, 'success!');
            });
          });
        }).then(result => {
          result.should.equal('success!');
          return pool.pquery('SELECT * from mysql_plus_transaction_test')
            .then(rows => {
              rows.should.have.length(1);
              rows[0].id.should.equal(2);
              done();
            });
        }).catch(done);
      });

      it('should rollback changes if an errors occur', done => {
        pool.transaction((trxn, trxnDone) => {
          trxn.query('INSERT INTO mysql_plus_transaction_test VALUES (3)', (err, result) => {
            if (err) {
              trxnDone(err);
              return;
            }

            result.affectedRows.should.equal(1);

            trxn.query('DELETE FROM mysql_plus_transaction_test WHERE id = ERROR', (err, result) => {
              if (err) {
                trxnDone(err);
                return;
              }

              result.affectedRows.should.equal(1);

              trxnDone(null, 'success!');
            });
          });
        }).then(result => {
          done(new Error(result));
        }).catch(err => {
          err.code.should.equal('ER_BAD_FIELD_ERROR');
          return pool.pquery('SELECT * from mysql_plus_transaction_test')
            .then(rows => {
              rows.should.have.length(1);
              rows[0].id.should.equal(2);
              done();
            });
        }).catch(done);
      });

    });


    describe('with a promise interface', () => {

      before(() => pool.pquery('CREATE TABLE mysql_plus_transaction_test (id int)'));

      after(() => pool.pquery('DROP TABLE mysql_plus_transaction_test'));

      it('should commit changes if no errors occur', () => {
        return pool.transaction(trxn => {
          return trxn.pquery('INSERT INTO mysql_plus_transaction_test VALUES (1), (2)')
            .then(result => {
              result.affectedRows.should.equal(2);
              return trxn.pquery('DELETE FROM mysql_plus_transaction_test WHERE id = 1');
            })
            .then(result => {
              result.affectedRows.should.equal(1);
              return 'success!';
            });
        }).then(result => {
          result.should.equal('success!');
          return pool.pquery('SELECT * FROM mysql_plus_transaction_test')
            .then(rows => {
              rows.should.have.length(1);
              rows[0].id.should.equal(2);
            });
        });
      });

      it('should rollback changes if an errors occur', () => {
        return pool.transaction(trxn => {
          return trxn.pquery('INSERT INTO mysql_plus_transaction_test VALUES (3)')
            .then(result => {
              result.affectedRows.should.equal(1);
              return trxn.pquery('DELETE FROM mysql_plus_transaction_test WHERE id = ERROR');
            })
            .then(result => {
              result.affectedRows.should.equal(1);
              return 'success!';
            });
        }).then(result => {
          throw new Error(result);
        }).catch(err => {
          err.code.should.equal('ER_BAD_FIELD_ERROR');
          return pool.pquery('SELECT * FROM mysql_plus_transaction_test')
            .then(rows => {
              rows.should.have.length(1);
              rows[0].id.should.equal(2);
            });
        });
      });

    });


    describe('with either interface', () => {

      before(done => {
        pool.query('CREATE TABLE mysql_plus_transaction_test (id int)', err => {
          if (err) throw err;
          pool.query('INSERT INTO mysql_plus_transaction_test VALUES (2)', done);
        });
      });

      after(done => {
        pool.query('DROP TABLE mysql_plus_transaction_test', done);
      });


      describe('if an error occured getting a connection', () => {

        const error = new Error('test error');

        before(() => {
          sinon.stub(pool, 'getConnection').yieldsAsync(error);
        });

        after(() => {
          pool.getConnection.restore();
        });

        it('should reject with an error', done => {
          pool.transaction(() => 'success!')
            .then(result => {
              done(new Error(result));
            })
            .catch(err => {
              err.should.equal(error);
              done();
            })
            .catch(done);
        });

      });


      describe('if an error occured beginning a transaction', () => {

        const error = new Error('test error');

        before(() => {
          sinon.stub(Connection.prototype, 'beginTransaction').yieldsAsync(error);
        });

        after(() => {
          Connection.prototype.beginTransaction.restore();
        });

        it('should reject with an error', done => {
          pool.transaction(() => 'success!')
            .then(result => {
              done(new Error(result));
            })
            .catch(err => {
              err.should.equal(error);
              done();
            })
            .catch(done);
        });

      });


      describe('if an error occured while trying to commit a transaction', () => {

        const error = new Error('test error');

        before(() => {
          sinon.stub(Connection.prototype, 'commit').yieldsAsync(error);
        });

        after(() => {
          Connection.prototype.commit.restore();
        });

        it('should reject with an error', done => {
          pool.transaction(trxn => {
            return trxn.pquery('INSERT INTO mysql_plus_transaction_test VALUES (3)');
          }).then(result => {
            done(new Error(result));
          }).catch(err => {
            err.should.equal(error);
            return pool.pquery('SELECT * FROM mysql_plus_transaction_test')
              .then(rows => {
                rows.should.have.length(1);
                rows[0].id.should.equal(2);
                done();
              });
          }).catch(done);
        });

      });

    });

  });


  describe('when defining tables', () => {

    var PoolStub;
    var PoolConfigStub;
    var MySQLTableStub;

    var MockPool;
    var TableDefinitionStub;

    before(() => {
      // Delete PoolPlus from the require cache
      delete require.cache[require.resolve('../../lib/PoolPlus')];

      // Stub some classes
      class MockClass {}
      PoolStub = sinon.stub(require.cache[require.resolve('mysql/lib/Pool')], 'exports').value(MockClass);
      PoolConfigStub = sinon.stub(require.cache[require.resolve('mysql/lib/PoolConfig')], 'exports').value(MockClass);
      MySQLTableStub = sinon.stub(require.cache[require.resolve('../../lib/MySQLTable')], 'exports').value(MockClass);
      sinon.stub(require.cache[require.resolve('../../lib/TableDefinition')], 'exports');

      // Prevent checking for duplicate table definitions
      sinon.stub(Map.prototype, 'has').returns(false);

      MockPool = require('../../lib/PoolPlus');
      TableDefinitionStub = require('../../lib/TableDefinition');
    });

    beforeEach(() => {
      TableDefinitionStub.reset();
    });

    after(() => {
      // Restore stubs
      PoolStub.restore();
      PoolConfigStub.restore();
      MySQLTableStub.restore();
      require.cache[require.resolve('../../lib/TableDefinition')].exports.restore();
      Map.prototype.has.restore();

      // Delete PoolPlus from the require cache again so when it is required next it will be normal
      delete require.cache[require.resolve('../../lib/PoolPlus')];
    });


    describe('in a non-production environment', () => {

      it('should use the correct migration strategy', () => {
        /* eslint-disable no-shadow */

        var pool;

        // Default config: {migrationStrategy: 'alter', allowAlterInProduction: false}
        pool = new MockPool({});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[0][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[1][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[2][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[3][3].should.equal('drop');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'safe',
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[4][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[5][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[6][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[7][3].should.equal('drop');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'alter',
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[8][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[9][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[10][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[11][3].should.equal('drop');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'drop',
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[12][3].should.equal('drop');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[13][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[14][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[15][3].should.equal('drop');

        pool = new MockPool({plusOptions: {
          allowAlterInProduction: true,
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[16][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[17][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[18][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[19][3].should.equal('drop');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'safe',
          allowAlterInProduction: true,
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[20][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[21][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[22][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[23][3].should.equal('drop');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'alter',
          allowAlterInProduction: true,
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[24][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[25][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[26][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[27][3].should.equal('drop');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'drop',
          allowAlterInProduction: true,
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[28][3].should.equal('drop');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[29][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[30][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[31][3].should.equal('drop');

        /* eslint-enable no-shadow */
      });

    });


    describe('in a production environment', () => {

      const nodeEnv = process.env.NODE_ENV;

      before(() => {
        process.env.NODE_ENV = 'production';
      });

      after(() => {
        process.env.NODE_ENV = nodeEnv;
      });

      it('should use the correct migration strategy', () => {
        /* eslint-disable no-shadow */

        var pool;

        // Default config: {migrationStrategy: 'safe', allowAlterInProduction: false}
        pool = new MockPool({});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[0][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[1][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[2][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[3][3].should.equal('safe');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'safe',
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[4][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[5][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[6][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[7][3].should.equal('safe');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'alter',
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[8][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[9][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[10][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[11][3].should.equal('safe');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'drop',
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[12][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[13][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[14][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[15][3].should.equal('safe');

        pool = new MockPool({plusOptions: {
          allowAlterInProduction: true,
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[16][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[17][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[18][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[19][3].should.equal('safe');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'safe',
          allowAlterInProduction: true,
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[20][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[21][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[22][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[23][3].should.equal('safe');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'alter',
          allowAlterInProduction: true,
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[24][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[25][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[26][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[27][3].should.equal('safe');

        pool = new MockPool({plusOptions: {
          migrationStrategy: 'drop',
          allowAlterInProduction: true,
        }});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[28][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[29][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[30][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[31][3].should.equal('safe');

        /* eslint-enable no-shadow */
      });

    });

  });


  describe('with debugging enabled', () => {

    const debugPool = new PoolPlus(Object.assign({plusOptions: {debug: true}}, config));

    before(() => {
      sinon.stub(debugPool, 'query').yieldsAsync(null, []);
    });

    after(done => {
      debugPool.query.restore();
      debugPool.end(done);
    });

    it('should log operations to the console when syncing', done => {
      sinon.stub(console, 'log');
      sinon.stub(Connection.prototype, 'query').yieldsAsync();

      debugPool.defineTable('pool_plus_test_table_debug_a', {
        columns: {
          id: debugPool.ColTypes.int().unsigned().notNull().primaryKey(),
        },
      });
      debugPool.defineTable('pool_plus_test_table_debug_b', {
        columns: {
          id: debugPool.ColTypes.char(1),
        },
      });

      debugPool.sync(err => {
        if (err) throw err;

        console.log.should.have.been.calledWithExactly([
          '',
          '============= mysql-plus operations: ==============',
          '',
          'type: CREATE_TABLE',
          'CREATE TABLE `pool_plus_test_table_debug_a` (',
          '  `id` int unsigned NOT NULL,',
          '  PRIMARY KEY (`id`)',
          ');',
          '',
          'type: CREATE_TABLE',
          'CREATE TABLE `pool_plus_test_table_debug_b` (',
          '  `id` char(1)',
          ');',
          '',
          '===================================================',
          '',
        ].join('\n'));

        console.log.restore();
        Connection.prototype.query.restore();
        done();
      });
    });

    it('should log the operation that failed to the console when syncing', done => {
      const error = new Error('MOCK ALTER TABLE ERROR');

      sinon.stub(console, 'log');
      sinon.stub(Connection.prototype, 'query').callsFake((sql, cb) => {
        process.nextTick(cb, sql.startsWith('ALTER') ? error : null);
      });

      debugPool.defineTable('pool_plus_test_table_debug_error', {
        columns: {
          id: debugPool.ColTypes.int().unsigned().notNull().primaryKey(),
        },
        foreignKeys: {
          id: 'non_existent_table.id',
        },
      });

      debugPool.sync(err => {
        err.should.equal(error);

        console.log.should.have.been.calledWithExactly([
          '',
          '====== mysql-plus sync errored on operation: ======',
          '',
          'type: ADD_FOREIGN_KEY',
          'ALTER TABLE `pool_plus_test_table_debug_error` ADD CONSTRAINT `fk_pool_plus_test_table_debug_error_id`',
          '  FOREIGN KEY (`id`) REFERENCES `non_existent_table` (`id`);',
          '',
          '===================================================',
          '',
        ].join('\n'));

        console.log.restore();
        Connection.prototype.query.restore();
        done();
      });
    });

  });

});
