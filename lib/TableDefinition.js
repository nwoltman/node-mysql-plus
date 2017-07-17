'use strict';

const KeyTypes = require('./constants/KeyTypes');
const Operation = require('./Operation');

const arraysEqual = require('./utils/arraysEqual');
const cloneKeys = require('./utils/cloneKeys');
const diffKeys = require('./utils/diffKeys');
const isKeyEqual = require('./utils/isKeyEqual');
const sqlToSchema = require('./sqlToSchema');

class TableDefinition {
  constructor(tableName, schema, pool, migrationStrategy) {
    this.name = tableName;
    this._escapedName = pool.escapeId(tableName);
    this._schema = createNormalizedSchema(schema);
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

      this._pool.query('SHOW CREATE TABLE ' + this._escapedName, (err, result) => {
        if (err) {
          cb(err);
          return;
        }
        const oldSchema = sqlToSchema(result[0]['Create Table']);
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

    const foreignKeys = this._schema.foreignKeys;
    for (var columnNames in foreignKeys) {
      const foreignKeyData = foreignKeys[columnNames];
      operations.push(Operation.create(
        Operation.Types.ADD_FOREIGN_KEY,
        'ALTER TABLE ' + this._escapedName + ' ADD ' +
          this._generateForeignKeySQL(columnNames, foreignKeyData)
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
      this._getMigrateKeysOperations(oldSchema, KeyTypes.UNIQUE, 'uniqueKeys'),
      this._getMigrateKeysOperations(oldSchema, KeyTypes.INDEX, 'indexes'),
      this._getMigrateKeysOperations(oldSchema, KeyTypes.SPATIAL, 'spatialIndexes'),
      this._getDropUnknownKeysOperations(oldSchema),
      this._getMigrateTableOptionsOperations(oldSchema)
    );
    const operations = this._getMigrateForeignKeysOperations(oldSchema, alterOperations);

    if (alterOperations.length) {
      const spacer = '\n       ';
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

      if (!oldColumnDefinition) {
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

    if (!isKeyEqual(newSchema.primaryKey, oldSchema.primaryKey)) {
      if (oldSchema.primaryKey) {
        operations.push(Operation.create(
          Operation.Types.DROP_KEY,
          'DROP PRIMARY KEY',
          oldSchema.primaryKey
        ));
      }
      if (newSchema.primaryKey) {
        const keySQL = this._generateKeySQL(KeyTypes.PRIMARY, newSchema.primaryKey);
        operations.push(Operation.create(
          Operation.Types.ADD_KEY,
          'ADD ' + keySQL
        ));
      }
    }

    return operations;
  }

  _getMigrateKeysOperations(oldSchema, keyType, schemaPropName) {
    const operations = [];
    const diff = diffKeys(oldSchema[schemaPropName], this._schema[schemaPropName]);
    const removedKeys = diff.removedKeys;
    const addedKeys = diff.addedKeys;
    var i;

    for (i = 0; i < removedKeys.length; i++) {
      const keyName = this._createKeyName(keyType, removedKeys[i]);
      operations.push(Operation.create(
        Operation.Types.DROP_KEY,
        'DROP KEY ' + this._pool.escapeId(keyName),
        removedKeys[i]
      ));
    }

    for (i = 0; i < addedKeys.length; i++) {
      const keySQL = this._generateKeySQL(keyType, addedKeys[i]);
      operations.push(Operation.create(
        Operation.Types.ADD_KEY,
        'ADD ' + keySQL
      ));
    }

    return operations;
  }

  _getDropUnknownKeysOperations(oldSchema) {
    const operations = [];
    const unknownKeys = oldSchema.$unknownKeys;

    for (var i = 0; i < unknownKeys.length; i++) {
      operations.push(Operation.create(
        Operation.Types.DROP_KEY,
        'DROP KEY ' + this._pool.escapeId(unknownKeys[i].name),
        unknownKeys[i].columns
      ));
    }

    return operations;
  }

  _getMigrateForeignKeysOperations(oldSchema, otherOperations) {
    const operations = [];
    const oldForeignKeys = oldSchema.foreignKeys;
    const newForeignKeys = this._schema.foreignKeys;
    const keysToAddBack = new Set();
    var columnNames;

    for (columnNames in oldForeignKeys) {
      const columnNamesArray = columnNames.split(',');

      if (newForeignKeys && isKeyEqual(oldForeignKeys[columnNames], newForeignKeys[columnNames])) {
        if (!mustAvoidforeignKeyConflict(columnNamesArray, otherOperations)) {
          continue;
        }
        keysToAddBack.add(columnNames);
      }

      const keyName = this._createKeyName(KeyTypes.FOREIGN, columnNamesArray);
      operations.push(Operation.create(
        Operation.Types.DROP_FOREIGN_KEY,
        'ALTER TABLE ' + this._escapedName + ' DROP FOREIGN KEY ' + this._pool.escapeId(keyName)
      ));
    }

    for (columnNames in newForeignKeys) {
      const newForeignKeyData = newForeignKeys[columnNames];
      if (!keysToAddBack.has(columnNames) && isKeyEqual(newForeignKeyData, oldForeignKeys[columnNames])) {
        continue;
      }
      const keySQL = this._generateForeignKeySQL(columnNames, newForeignKeyData);
      operations.push(Operation.create(
        Operation.Types.ADD_FOREIGN_KEY,
        'ALTER TABLE ' + this._escapedName + ' ADD ' + keySQL
      ));
    }

    return operations;
  }

  _getDropForeignKeysOperations(oldSchema) {
    const operations = [];
    const foreignKeys = oldSchema.foreignKeys;

    for (var columnNames in foreignKeys) {
      columnNames = columnNames.split(',');
      const keyName = this._createKeyName(KeyTypes.FOREIGN, columnNames);
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
    const spacer = '\n       ';
    const separator = ',' + spacer;

    var sql = 'CREATE TABLE ' + this._escapedName + ' (' + spacer;

    const columns = schema.columns;
    for (const columnName in columns) {
      sql += pool.escapeId(columnName) + ' ' + columns[columnName].$toSQL() + separator;
    }

    if (schema.primaryKey) {
      sql += this._generateKeySQL(KeyTypes.PRIMARY, schema.primaryKey) + separator;
    }

    if (schema.uniqueKeys) {
      for (let i = 0; i < schema.uniqueKeys.length; i++) {
        sql += this._generateKeySQL(KeyTypes.UNIQUE, schema.uniqueKeys[i]) + separator;
      }
    }

    if (schema.indexes) {
      for (let i = 0; i < schema.indexes.length; i++) {
        sql += this._generateKeySQL(KeyTypes.INDEX, schema.indexes[i]) + separator;
      }
    }

    if (schema.spatialIndexes) {
      for (let i = 0; i < schema.spatialIndexes.length; i++) {
        sql += this._generateKeySQL(KeyTypes.SPATIAL, schema.spatialIndexes[i]) + separator;
      }
    }

    // Foreign keys are handled separately because they should not be
    // in the initial CREATE TABLE statement in case the tables being
    // referenced haven't been created yet

    // Slice off the trailing ',' and close the CREATE TABLE statement
    sql = sql.slice(0, -separator.length) + '\n     )';

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

  /**
   * Returns a constraint key name based on the key type and the columns they comprise the key.
   *
   * @private
   * @param {KEY_TYPE} type - The type of key (should never be PRIMARY).
   * @param {string|string[]} columns - A single column name or an array of column names from the current table.
   * @returns {string} The key name.
   */
  _createKeyName(type, columns) {
    if (columns instanceof Array) {
      columns = columns.join('_');
    }

    if (type === KeyTypes.UNIQUE) {
      return 'unique_' + this.name + '_' + columns;
    }
    if (type === KeyTypes.INDEX) {
      return 'index_' + this.name + '_' + columns;
    }
    if (type === KeyTypes.SPATIAL) {
      return 'spatial_' + this.name + '_' + columns;
    }
    // type === KeyTypes.FOREIGN
    return 'fk_' + this.name + '_' + columns;
  }

  /**
   * Generates SQL code that defines a constraint key.
   *
   * @private
   * @param {KEY_TYPE} type - The type of key (cannot be FOREIGN).
   * @param {string|Array} columns - A single column name or an array of column names.
   * @returns {string} SQL code.
   */
  _generateKeySQL(type, columns) {
    const pool = this._pool;
    var sql = '';

    if (type === KeyTypes.PRIMARY) {
      sql += 'PRIMARY KEY';
    } else if (type === KeyTypes.UNIQUE) {
      sql += 'UNIQUE KEY ' + pool.escapeId(this._createKeyName(type, columns));
    } else if (type === KeyTypes.SPATIAL) {
      sql += 'SPATIAL INDEX ' + pool.escapeId(this._createKeyName(type, columns));
    } else { // KeyTypes.INDEX
      sql += 'INDEX ' + pool.escapeId(this._createKeyName(type, columns));
    }

    sql += ' (' + pool.escapeId(columns) + ')';

    return sql;
  }

  /**
   * Generates SQL code that specifies a foreign key constraint.
   *
   * @private
   * @param {string} columns - A comma-separated list of names of columns that form a key in the current table.
   * @param {Object|string} foreignKeyData - A string of the form `ref_table.ref_column` or
   *     an object with the following attributes:
   * @param {string} foreignKeyData.table - The name of the table being referenced.
   * @param {string|string[]} foreignKeyData.column - The column(s) being referenced.
   * @param {string} [foreignKeyData.onDelete] - RESTRICT | CASCADE | SET NULL | NO ACTION
   * @param {string} [foreignKeyData.onUpdate] - RESTRICT | CASCADE | SET NULL | NO ACTION
   * @returns {string} SQL code.
   */
  _generateForeignKeySQL(columns, foreignKeyData) {
    columns = columns.split(',');
    const pool = this._pool;

    var sql = 'CONSTRAINT ' + pool.escapeId(this._createKeyName(KeyTypes.FOREIGN, columns)) +
      ' FOREIGN KEY (' + pool.escapeId(columns) + ')' +
      ' REFERENCES ' + pool.escapeId(foreignKeyData.table) +
      ' (' + pool.escapeId(foreignKeyData.column) + ')';

    if (foreignKeyData.onDelete) {
      sql += ' ON DELETE ' + foreignKeyData.onDelete;
    }
    if (foreignKeyData.onUpdate) {
      sql += ' ON UPDATE ' + foreignKeyData.onUpdate;
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
 * @returns {Object} The normalized schema.
 */
function createNormalizedSchema(schema) {
  const columns = schema.columns;

  if (schema.primaryKey) { // Make sure primary key columns are not null
    if (schema.primaryKey instanceof Array) {
      for (var i = 0; i < schema.primaryKey.length; i++) {
        columns[schema.primaryKey[i]].notNull();
      }
    } else {
      columns[schema.primaryKey].notNull();
    }
  }

  const keys = {
    uniqueKeys: cloneKeys(schema.uniqueKeys),
    indexes: cloneKeys(schema.indexes),
    spatialIndexes: cloneKeys(schema.spatialIndexes),
    foreignKeys: getNormalizedForeignKeys(schema.foreignKeys),
  };

  // Move keys defined in the columns to the schema body
  for (const columnName in columns) {
    const column = columns[columnName];
    if (column.$primaryKey) {
      keys.primaryKey = columnName;
    }
    if (column.$unique) {
      keys.uniqueKeys = keys.uniqueKeys || [];
      keys.uniqueKeys.push(columnName);
    }
    if (column.$index) {
      keys.indexes = keys.indexes || [];
      keys.indexes.push(columnName);
    }
    if (column.$spatialIndex) {
      keys.spatialIndexes = keys.spatialIndexes || [];
      keys.spatialIndexes.push(columnName);
    }
  }

  return Object.assign({}, schema, keys);
}

function getNormalizedForeignKeys(foreignKeys) {
  if (!foreignKeys) {
    return foreignKeys;
  }

  const normalizedForeignKeys = {};

  for (const keyColumns in foreignKeys) {
    const foreignKeyData = foreignKeys[keyColumns];
    const normalizedKeyColumns = keyColumns.replace(/\s+/g, ''); // "a,b" is standard, "a, b" is not

    if (typeof foreignKeyData === 'string') {
      const foreignKeyParts = foreignKeyData.split('.');
      normalizedForeignKeys[normalizedKeyColumns] = {
        table: foreignKeyParts[0],
        column: foreignKeyParts[1],
        onDelete: null,
        onUpdate: null,
      };
    } else {
      normalizedForeignKeys[normalizedKeyColumns] = {
        table: foreignKeyData.table,
        column: foreignKeyData.column,
        // RESTRICT is the default and doesn't show up in CREATE TABLE statements, so don't use it.
        onDelete: foreignKeyData.onDelete && foreignKeyData.onDelete.toUpperCase() !== 'RESTRICT'
          ? foreignKeyData.onDelete
          : null,
        onUpdate: foreignKeyData.onUpdate && foreignKeyData.onUpdate.toUpperCase() !== 'RESTRICT'
          ? foreignKeyData.onUpdate
          : null,
      };
    }
  }

  return normalizedForeignKeys;
}

// Check if a foreign key needs to be removed before performing other operations
function mustAvoidforeignKeyConflict(fkColumnNames, operations) {
  for (var i = 0; i < operations.length; i++) {
    const operation = operations[i];

    if (operation.type === Operation.Types.MODIFY_COLUMN) {
      const columnName = operation.columns[0];

      if (fkColumnNames.indexOf(columnName) >= 0) {
        return true;
      }

      continue;
    }

    if (operation.type === Operation.Types.DROP_KEY) { // Check if the key used in the foreign key is getting dropped
      const opColumnNames = typeof operation.columns === 'string'
        ? [operation.columns]
        : operation.columns;

      if (fkColumnNames.length === 1) {
        if (fkColumnNames[0] === opColumnNames[0]) {
          return true;
        }
      } else if (arraysEqual(fkColumnNames, opColumnNames)) {
        return true;
      }
    }
  }

  return false;
}

module.exports = TableDefinition;
