'use strict';

const ColumnDefinitions = require('../../lib/ColumnDefinitions');
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


  describe('.Type', () => { // TODO: Remove after v0.4.0 is released.

    it('should provide the ColumnDefinitions functions', () => {
      pool.Type.should.equal(ColumnDefinitions);
    });

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
      should.throws(() => new PoolPlus({migrationStrategy: 'bleh'}), /not a valid migration strategy/);
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


  describe('#defineTable()', () => {

    it('should return a MySQLTable instance', () => {
      const table = pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
      table.should.be.an.instanceOf(MySQLTable);
      table.tableName.should.equal(TEST_TABLE_NAME); // TODO: Remove after v0.4.0 is released
      table.name.should.equal(TEST_TABLE_NAME);
      table.schema.should.equal(TEST_TABLE_SCHEMA);
    });

    it('should throw if no arguments are provided', () => {
      should.throws(() => pool.defineTable(), Error);
    });

    it('should throw if the table name is not a string', () => {
      should.throws(() => pool.defineTable(/table/), /The table name must be a string/);
    });

    it('should throw if no columns are provided', () => {
      should.throws(() => pool.defineTable('table', {}), /must have.*column/);
      should.throws(() => pool.defineTable('table', {columns: {}}), /must have.*column/);
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
        if (err) throw err;
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


    describe('if an error occured getting a connection', () => {

      const error = new Error('test error');

      before(() => {
        sinon.stub(pool, 'getConnection', function(cb) {
          process.nextTick(() => cb(error));
        });
        sinon.stub(TableDefinition.prototype, 'genSyncOperations', function(cb) {
          process.nextTick(() => cb(null, [{sql: 'pretend sql', type: -1}]));
        });
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

    });


    describe('if an error occured getting the sync operations', () => {

      const error = new Error('test error');

      before(() => {
        sinon.stub(TableDefinition.prototype, 'genSyncOperations', function(cb) {
          process.nextTick(() => cb(error));
        });
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

    });

  });


  describe('when defining tables', () => {

    var MockPool;
    var TableDefinitionStub;

    before(() => {
      // Delete PoolPlus from the require cache
      delete require.cache[require.resolve('../../lib/PoolPlus')];

      // Stub some classes
      sinon.stub(require.cache[require.resolve('mysql/lib/Pool')], 'exports');
      sinon.stub(require.cache[require.resolve('mysql/lib/PoolConfig')], 'exports');
      sinon.stub(require.cache[require.resolve('../../lib/MySQLTable')], 'exports');
      sinon.stub(require.cache[require.resolve('../../lib/TableDefinition')], 'exports');

      // Prevent checking for duplicate table definitions
      sinon.stub(Map.prototype, 'has', () => false);

      MockPool = require('../../lib/PoolPlus');
      TableDefinitionStub = require('../../lib/TableDefinition');
    });

    beforeEach(() => {
      TableDefinitionStub.reset();
    });

    after(() => {
      // Restore stubs
      require.cache[require.resolve('mysql/lib/Pool')].exports.restore();
      require.cache[require.resolve('mysql/lib/PoolConfig')].exports.restore();
      require.cache[require.resolve('../../lib/MySQLTable')].exports.restore();
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

        pool = new MockPool({migrationStrategy: 'safe'});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[4][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[5][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[6][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[7][3].should.equal('drop');

        pool = new MockPool({migrationStrategy: 'alter'});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[8][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[9][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[10][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[11][3].should.equal('drop');

        pool = new MockPool({migrationStrategy: 'drop'});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[12][3].should.equal('drop');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[13][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[14][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[15][3].should.equal('drop');

        pool = new MockPool({allowAlterInProduction: true});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[16][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[17][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[18][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[19][3].should.equal('drop');

        pool = new MockPool({migrationStrategy: 'safe', allowAlterInProduction: true});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[20][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[21][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[22][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[23][3].should.equal('drop');

        pool = new MockPool({migrationStrategy: 'alter', allowAlterInProduction: true});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[24][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[25][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[26][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[27][3].should.equal('drop');

        pool = new MockPool({migrationStrategy: 'drop', allowAlterInProduction: true});

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

        pool = new MockPool({migrationStrategy: 'safe'});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[4][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[5][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[6][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[7][3].should.equal('safe');

        pool = new MockPool({migrationStrategy: 'alter'});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[8][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[9][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[10][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[11][3].should.equal('safe');

        pool = new MockPool({migrationStrategy: 'drop'});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[12][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[13][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[14][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[15][3].should.equal('safe');

        pool = new MockPool({allowAlterInProduction: true});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[16][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[17][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[18][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[19][3].should.equal('safe');

        pool = new MockPool({migrationStrategy: 'safe', allowAlterInProduction: true});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[20][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[21][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[22][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[23][3].should.equal('safe');

        pool = new MockPool({migrationStrategy: 'alter', allowAlterInProduction: true});

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA);
        TableDefinitionStub.args[24][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'safe');
        TableDefinitionStub.args[25][3].should.equal('safe');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'alter');
        TableDefinitionStub.args[26][3].should.equal('alter');

        pool.defineTable(TEST_TABLE_NAME, TEST_TABLE_SCHEMA, 'drop');
        TableDefinitionStub.args[27][3].should.equal('safe');

        pool = new MockPool({migrationStrategy: 'drop', allowAlterInProduction: true});

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

});
