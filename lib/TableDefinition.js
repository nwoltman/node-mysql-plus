'use strict';

const ForeignKeyDefinition = require('./KeyDefinitions/ForeignKeyDefinition');
const KeyDefinitions = require('./KeyDefinitions');
const Operation = require('./Operation');
const PrimaryKeyDefinition = require('./KeyDefinitions/PrimaryKeyDefinition');

const sqlToSchema = require('./sqlToSchema');

class TableDefinition {
  constructor(tableName, schema, pool, migrationStrategy) {
    this.name = tableName;
    this._escapedName = pool.escapeId(tableName);
    this._schema = createInternalSchema(schema, tableName);
    this._pool = pool;
    this._migrationStrategy = migrationStrategy;
  }

  genSyncOperations(cb) {
    this._pool.query('SHOW TABLES LIKE \'' + this.name + '\'', (err, result) => {
      if (err) {
        cb(err);
        return;
      }

      if (!result.length) { // Does not exist, so create
        cb(null, this._getCreateTableOperations());
        return;
      }

      if (this._migrationStrategy === 'safe') {
        cb(null, []);
        return;
      }

      this._pool.query('SHOW CREATE TABLE ' + this._escapedName, (err, rows) => {
        if (err) {
          cb(err);
          return;
        }
        const oldSchema = sqlToSchema(rows[0]['Create Table']);
        if (this._migrationStrategy === 'drop') {
          const operations = this._getDropForeignKeysOperations(oldSchema).concat(
            this._getDropTableOperations(),
            this._getCreateTableOperations()
          );
          cb(null, operations);
        } else { // alter
          cb(null, this._getMigrateTableOperations(oldSchema));
        }
      });
    });
  }

  _getCreateTableOperations() {
    const operations = [];

    operations.push(Operation.create(
      Operation.Types.CREATE_TABLE,
      this._schemaToSQL()
    ));

    const {foreignKeys} = this._schema;

    for (const keyName in foreignKeys) {
      operations.push(Operation.create(
        Operation.Types.ADD_FOREIGN_KEY,
        `ALTER TABLE ${this._escapedName} ADD ${foreignKeys[keyName].$toSQL()}`
      ));
    }

    return operations;
  }

  _getDropTableOperations() {
    return [
      Operation.create(
        Operation.Types.DROP_TABLE,
        'DROP TABLE ' + this._escapedName
      ),
    ];
  }

  _getMigrateTableOperations(oldSchema) {
    const alterOperations = this._getMigrateColumnsOperations(oldSchema).concat(
      this._getMigratePrimaryKeyOperations(oldSchema),
      this._getMigrateIndexKeysOperations(oldSchema),
      this._getMigrateTableOptionsOperations(oldSchema)
    );
    const operations = this._getMigrateForeignKeysOperations(oldSchema, alterOperations);

    if (alterOperations.length) {
      const spacer = '\n  ';

      alterOperations.sort(Operation.sorter);
      operations.push(Operation.create(
        Operation.Types.ALTER_TABLE,
        'ALTER TABLE ' + this._escapedName + spacer + alterOperations.map(op => op.sql).join(',' + spacer)
      ));
    }

    return operations;
  }

  _getMigrateColumnsOperations(oldSchema) {
    const pool = this._pool;
    const newSchema = this._schema;
    const operations = [];
    const renamedColumns = []; // List of old column names
    var lastColumnName = null;
    var columnName;

    // Add new columns and modify existing columns
    for (columnName in newSchema.columns) {
      const newColumnDefinition = newSchema.columns[columnName];
      const oldColumnName = newColumnDefinition.$oldName && oldSchema.columns[newColumnDefinition.$oldName]
        ? newColumnDefinition.$oldName
        : columnName;
      const oldColumnDefinition = oldSchema.columns[oldColumnName];
      const position = lastColumnName ? ' AFTER ' + pool.escapeId(lastColumnName) : ' FIRST';

      if (oldColumnDefinition === undefined) {
        operations.push(Operation.create(
          Operation.Types.ADD_COLUMN,
          'ADD COLUMN ' + pool.escapeId(columnName) + ' ' + newColumnDefinition.$toSQL() + position
        ));
      } else if (columnName !== oldColumnName) { // Rename column (also modifies the column if needed)
        operations.push(Operation.create(
          Operation.Types.CHANGE_COLUMN,
          `CHANGE COLUMN ${pool.escapeId(oldColumnName)} ${pool.escapeId(columnName)} ` +
            newColumnDefinition.$toSQL() + position
        ));
        renamedColumns.push(oldColumnName);
      } else if (!newColumnDefinition.$equals(oldColumnDefinition, oldSchema)) {
        operations.push(Operation.create(
          Operation.Types.MODIFY_COLUMN,
          'MODIFY COLUMN ' + pool.escapeId(columnName) + ' ' + newColumnDefinition.$toSQL() + position,
          [columnName]
        ));
      }

      lastColumnName = columnName;
    }

    // Drop old columns (unless the column is being renamed)
    for (columnName in oldSchema.columns) {
      if (newSchema.columns[columnName] || renamedColumns.indexOf(columnName) >= 0) {
        continue;
      }

      operations.push(Operation.create(
        Operation.Types.DROP_COLUMN,
        'DROP COLUMN ' + pool.escapeId(columnName)
      ));
    }

    return operations;
  }

  _getMigratePrimaryKeyOperations(oldSchema) {
    const operations = [];
    const newSchema = this._schema;

    if (!isPrimaryKeyEqual(newSchema.primaryKey, oldSchema.primaryKey)) {
      if (oldSchema.primaryKey) {
        operations.push(Operation.create(
          Operation.Types.DROP_KEY,
          'DROP PRIMARY KEY'
        ));
      }
      if (newSchema.primaryKey) {
        operations.push(Operation.create(
          Operation.Types.ADD_KEY,
          'ADD ' + newSchema.primaryKey.$toSQL()
        ));
      }
    }

    return operations;
  }

  _getMigrateIndexKeysOperations(oldSchema) {
    const operations = [];
    const oldKeys = oldSchema.indexKeys;
    const newKeys = this._schema.indexKeys;

    for (const keyName in oldKeys) { // Remove old/changed keys
      if (newKeys[keyName] === undefined || !oldKeys[keyName].$equals(newKeys[keyName])) {
        operations.push(Operation.create(
          Operation.Types.DROP_KEY,
          'DROP KEY ' + this._pool.escapeId(keyName)
        ));
      }
    }

    for (const keyName in newKeys) { // Add new/changed keys
      if (oldKeys[keyName] === undefined || !newKeys[keyName].$equals(oldKeys[keyName])) {
        operations.push(Operation.create(
          Operation.Types.ADD_KEY,
          'ADD ' + newKeys[keyName].$toSQL()
        ));
      }
    }

    return operations;
  }

  _getMigrateForeignKeysOperations(oldSchema, otherOperations) {
    const operations = [];
    const oldKeys = oldSchema.foreignKeys;
    const newKeys = this._schema.foreignKeys;
    const keysToAddBack = new Set();

    for (const keyName in oldKeys) { // Remove old/changed keys
      const oldKey = oldKeys[keyName];

      if (newKeys[keyName] !== undefined && oldKey.$equals(newKeys[keyName])) {
        if (!mustAvoidForeignKeyConflict(oldKey.$columns, otherOperations)) {
          continue;
        }
        keysToAddBack.add(keyName);
      }

      operations.push(Operation.create(
        Operation.Types.DROP_FOREIGN_KEY,
        'ALTER TABLE ' + this._escapedName + ' DROP FOREIGN KEY ' + this._pool.escapeId(keyName)
      ));
    }

    for (const keyName in newKeys) { // Add new/changed keys
      const newKey = newKeys[keyName];

      if (keysToAddBack.has(keyName) || oldKeys[keyName] === undefined || !newKey.$equals(oldKeys[keyName])) {
        operations.push(Operation.create(
          Operation.Types.ADD_FOREIGN_KEY,
          'ALTER TABLE ' + this._escapedName + ' ADD ' + newKey.$toSQL()
        ));
      }
    }

    return operations;
  }

  _getDropForeignKeysOperations(oldSchema) {
    const operations = [];

    for (const keyName in oldSchema.foreignKeys) {
      operations.push(Operation.create(
        Operation.Types.DROP_FOREIGN_KEY,
        'ALTER TABLE ' + this._escapedName + ' DROP FOREIGN KEY ' + this._pool.escapeId(keyName)
      ));
    }

    return operations;
  }

  _getMigrateTableOptionsOperations(oldSchema) {
    const operations = [];
    const newSchema = this._schema;

    // ENGINE
    if (newSchema.engine && newSchema.engine !== oldSchema.engine) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'ENGINE=' + newSchema.engine
      ));
    }

    // AUTO_INCREMENT
    if (
      typeof newSchema.autoIncrement === 'number' &&
      (typeof oldSchema.autoIncrement !== 'number' || newSchema.autoIncrement > oldSchema.autoIncrement)
    ) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'AUTO_INCREMENT=' + newSchema.autoIncrement
      ));
    }

    // [DEFAULT] CHARACTER SET
    if (newSchema.charset && newSchema.charset !== oldSchema.charset) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'CHARSET=' + newSchema.charset
      ));
    }

    // [DEFAULT] COLLATE
    if (newSchema.collate && newSchema.collate !== oldSchema.collate) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'COLLATE=' + newSchema.collate
      ));
    }

    // COMPRESSION
    if (newSchema.compression && newSchema.compression !== oldSchema.compression) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'COMPRESSION=' + this._pool.escape(newSchema.compression)
      ));
    }

    // ROW_FORMAT
    if (newSchema.rowFormat && newSchema.rowFormat !== oldSchema.rowFormat) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'ROW_FORMAT=' + newSchema.rowFormat
      ));
    }

    return operations;
  }

  _schemaToSQL() {
    const pool = this._pool;
    const schema = this._schema;
    const spacer = '\n  ';
    const separator = ',' + spacer;

    var sql = 'CREATE TABLE ' + this._escapedName + ' (' + spacer;

    const {columns} = schema;
    for (const columnName in columns) {
      sql += pool.escapeId(columnName) + ' ' + columns[columnName].$toSQL() + separator;
    }

    if (schema.primaryKey) {
      sql += schema.primaryKey.$toSQL() + separator;
    }

    for (const keyName in schema.indexKeys) {
      sql += schema.indexKeys[keyName].$toSQL() + separator;
    }

    // Foreign keys are handled separately because they should not be
    // in the initial CREATE TABLE statement in case the tables being
    // referenced haven't been created yet.

    // Slice off the trailing ',' and close the CREATE TABLE statement
    sql = sql.slice(0, -separator.length) + '\n)';

    if (schema.engine) {
      sql += ' ENGINE=' + schema.engine;
    }
    if (typeof schema.autoIncrement === 'number') {
      sql += ' AUTO_INCREMENT=' + schema.autoIncrement;
    }
    if (schema.charset) {
      sql += ' CHARSET=' + schema.charset;
    }
    if (schema.collate) {
      sql += ' COLLATE=' + schema.collate;
    }
    if (schema.compression) {
      sql += ' COMPRESSION=' + pool.escape(schema.compression);
    }
    if (schema.rowFormat) {
      sql += ' ROW_FORMAT=' + schema.rowFormat;
    }

    return sql;
  }
}

/**
 * Returns a copy of the schema in a consistent format that
 * is better for comparing schemas for migration.
 *
 * @private
 * @param {Object} schema The user-input schema.
 * @returns {Object} The formatted schema.
 */
function createInternalSchema(schema, tableName) {
  const {columns, keys} = schema;
  const indexKeys = {};
  const foreignKeys = {};

  if (keys) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (key instanceof ForeignKeyDefinition) {
        key.$setTableName(tableName);
        foreignKeys[key.$name] = key;
      } else {
        indexKeys[key.$name] = key;
      }
    }
  }

  let columnPK = null;

  // Extract keys defined in the columns
  for (const columnName in columns) {
    const column = columns[columnName];

    if (column.$primaryKey) {
      columnPK = columnName;
    }
    if (column.$unique) {
      const key = KeyDefinitions.uniqueIndex(columnName);
      indexKeys[key.$name] = key;
    }
    if (column.$index) {
      const key = KeyDefinitions.index(columnName);
      indexKeys[key.$name] = key;
    }
    if (column.$spatialIndex) {
      const key = KeyDefinitions.spatialIndex(columnName);
      indexKeys[key.$name] = key;
    }
    if (column.$fulltextIndex) {
      const key = KeyDefinitions.fulltextIndex(columnName);
      indexKeys[key.$name] = key;
    }
  }

  let primaryKey = null;

  if (schema.primaryKey) { // The primaryKey in the schema takes precedence over one defined by a column
    if (typeof schema.primaryKey === 'string') {
      primaryKey = new PrimaryKeyDefinition([schema.primaryKey]);
    } else { // schema.primaryKey is an Array
      primaryKey = new PrimaryKeyDefinition(schema.primaryKey);
    }
    // Make sure primary key columns are not null
    for (const colName of primaryKey.$columnNames) {
      columns[colName].notNull();
    }
  } else if (columnPK !== null) {
    primaryKey = new PrimaryKeyDefinition([columnPK]);
  }

  return Object.assign({}, schema, {primaryKey, indexKeys, foreignKeys});
}

function isPrimaryKeyEqual(newKey, oldKey) {
  if (newKey === null) {
    return oldKey === null;
  }
  if (oldKey === null) {
    return false;
  }
  return newKey.$equals(oldKey);
}

// Check if a foreign key needs to be removed before performing other operations
function mustAvoidForeignKeyConflict(fkColumnNames, operations) {
  for (var i = 0; i < operations.length; i++) {
    const operation = operations[i];

    // If a column being modified is part of a foreign key, the FK must be dropped to allow the modification
    if (operation.type === Operation.Types.MODIFY_COLUMN) {
      const columnName = operation.columns[0]; // There is only ever one column for MODIFY_COLUMN operations
      if (fkColumnNames.indexOf(columnName) >= 0) {
        return true;
      }
    }
  }

  return false;
}

module.exports = TableDefinition;
