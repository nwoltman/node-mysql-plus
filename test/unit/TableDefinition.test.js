'use strict';

const MySQLPlus = require('../../lib/MySQLPlus');
const Operation = require('../../lib/Operation');
const TableDefinition = require('../../lib/TableDefinition');

describe('TableDefinition', () => {

  const existingTableName = 'mock_existing_table_to_migrate';
  const existingTableSQL =
    'CREATE TABLE `' + existingTableName + '` (\n' +
    '  `id` bigint unsigned NOT NULL,\n' +
    '  PRIMARY KEY (`id`)\n' +
    ')';

  const throwTableSchema = {
    columns: {id: MySQLPlus.Type.int()},
  };
  const throwTable1Name = 'mock_throw_table_1';
  const throwTable2Name = 'mock_throw_table_2';
  const error1 = new Error('Error for ' + throwTable1Name);
  const error2 = new Error('Error for ' + throwTable2Name);

  // This makes query() synchronous so genSyncOperations() will also be synchronous
  const mockPool = {
    escape: MySQLPlus.escape,
    escapeId: MySQLPlus.escapeId,
    query(sql, cb) {
      switch (sql) {
        case `SHOW TABLES LIKE '${existingTableName}'`:
          cb(null, [existingTableName]);
          break;
        case `SHOW CREATE TABLE \`${existingTableName}\``:
          cb(null, [{'Create Table': existingTableSQL}]);
          break;
        case `SHOW TABLES LIKE '${throwTable1Name}'`:
          cb(error1);
          break;
        case `SHOW TABLES LIKE '${throwTable2Name}'`:
          cb(null, [throwTable2Name]); // Pretend the table exists
          break;
        case `SHOW CREATE TABLE \`${throwTable2Name}\``:
          cb(error2);
          break;
        default:
          cb(null, []);
          break;
      }
    },
  };


  describe('#genSyncOperations()', () => {

    it('should pass the error to the callback if querying the database results in an error', () => {
      new TableDefinition(throwTable1Name, throwTableSchema, mockPool)
        .genSyncOperations(err => {
          err.should.equal(error1);
        });

      new TableDefinition(throwTable2Name, throwTableSchema, mockPool, 'alter')
        .genSyncOperations(err => {
          err.should.equal(error2);
        });
    });

  });


  describe('if the table does not exist', () => {

    it('should always generate a CREATE TABLE operation', () => {
      const tableName = 'table_definition_test_table';
      const schema = {
        columns: {
          id: MySQLPlus.Type.int().unsigned().notNull().primaryKey(),
        },
      };
      const expectedOperations = [
        Operation.create(
          Operation.Types.CREATE_TABLE,
          'CREATE TABLE `' + tableName + '` (' +
            '`id` int unsigned NOT NULL,' +
            'PRIMARY KEY (`id`)' +
          ')'
        ),
      ];

      new TableDefinition(tableName, schema, mockPool, 'safe')
        .genSyncOperations((err, operations) => {
          if (err) throw err;
          operations.should.deepEqual(expectedOperations);
        });

      new TableDefinition(tableName, schema, mockPool, 'alter')
        .genSyncOperations((err, operations) => {
          if (err) throw err;
          operations.should.deepEqual(expectedOperations);
        });

      new TableDefinition(tableName, schema, mockPool, 'drop')
        .genSyncOperations((err, operations) => {
          if (err) throw err;
          operations.should.deepEqual(expectedOperations);
        });
    });

  });


  describe('if the table already exists', () => {

    const newSchema = {
      columns: {id: MySQLPlus.Type.int().unsigned().notNull()},
    };

    describe('and the migration strategy is "safe"', () => {

      it('should not generate any operations', () => {
        const expectedOperations = [];
        new TableDefinition(existingTableName, newSchema, mockPool, 'safe')
          .genSyncOperations((err, operations) => {
            if (err) throw err;
            operations.should.deepEqual(expectedOperations);
          });
      });

    });

    describe('and the migration strategy is "alter"', () => {

      it('should generate table migration operations', () => {
        const expectedOperations = [
          Operation.create(
            Operation.Types.MODIFY_COLUMN,
            'ALTER TABLE `' + existingTableName + '` MODIFY COLUMN `id` int unsigned NOT NULL'
          ),
          Operation.create(
            Operation.Types.DROP_KEY,
            'ALTER TABLE `' + existingTableName + '` DROP PRIMARY KEY'
          ),
        ];
        new TableDefinition(existingTableName, newSchema, mockPool, 'alter')
          .genSyncOperations((err, operations) => {
            if (err) throw err;
            operations.should.deepEqual(expectedOperations);
          });
      });

    });

    describe('and the migration strategy is "drop"', () => {

      it('should generate a DROP and a CREATE TABLE operation (when no foreign keys are present)', () => {
        const expectedOperations = [
          Operation.create(
            Operation.Types.DROP_TABLE,
            'DROP TABLE `' + existingTableName + '`'
          ),
          Operation.create(
            Operation.Types.CREATE_TABLE,
            'CREATE TABLE `' + existingTableName + '` (`id` int unsigned NOT NULL)'
          ),
        ];
        new TableDefinition(existingTableName, newSchema, mockPool, 'drop')
          .genSyncOperations((err, operations) => {
            if (err) throw err;
            operations.should.deepEqual(expectedOperations);
          });
      });

    });

  });

});
