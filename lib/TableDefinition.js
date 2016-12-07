'use strict';

const ColumnDefinitions = require('./ColumnDefinitions');
const Operation = require('./Operation');

const cloneDeep = require('lodash/cloneDeep');
const diffKeys = require('./utils/diffKeys');
const isEmpty = require('lodash/isEmpty');
const isEqual = require('lodash/isEqual');

const KEY_TYPES = {
  PRIMARY: 1,
  UNIQUE: 2,
  INDEX: 3,
  FOREIGN: 4,
};

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
    return this._getMigrateColumnsOperations(oldSchema).concat(
      this._getMigratePrimaryKeyOperations(oldSchema),
      this._getMigrateUniqueKeysOperations(oldSchema),
      this._getMigrateIndexesOperations(oldSchema),
      this._getMigrateForeignKeysOperations(oldSchema),
      this._getMigrateTableOptionsOperations(oldSchema)
    );
  }

  _getMigrateColumnsOperations(oldSchema) {
    const pool = this._pool;
    const escapedName = this._escapedName;
    const newSchema = this._schema;
    const operations = [];
    const renamedColumns = []; // List of old column names
    var columnName;

    // Add new columns and modify existing columns
    for (columnName in newSchema.columns) {
      const newColumnDefinition = newSchema.columns[columnName];
      const oldColumnName = newColumnDefinition.$oldName && oldSchema.columns[newColumnDefinition.$oldName]
        ? newColumnDefinition.$oldName
        : columnName;
      const oldColumnDefinition = oldSchema.columns[oldColumnName];

      if (!oldColumnDefinition) {
        operations.push(Operation.create(
          Operation.Types.ADD_COLUMN,
          'ALTER TABLE ' + escapedName + ' ADD COLUMN ' + pool.escapeId(columnName) +
            ' ' + newColumnDefinition.$toSQL()
        ));
      } else if (columnName !== oldColumnName) {
        operations.push(Operation.create(
          Operation.Types.CHANGE_COLUMN,
          `ALTER TABLE ${escapedName} CHANGE COLUMN ${pool.escapeId(oldColumnName)} ${pool.escapeId(columnName)} ` +
            newColumnDefinition.$toSQL()
        ));
        renamedColumns.push(oldColumnName);
      } else if (!newColumnDefinition.$equals(oldColumnDefinition, oldSchema)) {
        operations.push(Operation.create(
          Operation.Types.MODIFY_COLUMN,
          'ALTER TABLE ' + escapedName + ' MODIFY COLUMN ' + pool.escapeId(columnName) +
            ' ' + newColumnDefinition.$toSQL()
        ));
      }
    }

    // Drop old columns (unless the column is being changed)
    for (columnName in oldSchema.columns) {
      if (newSchema.columns[columnName] || renamedColumns.indexOf(columnName) >= 0) {
        continue;
      }
      operations.push(Operation.create(
        Operation.Types.DROP_COLUMN,
        'ALTER TABLE ' + escapedName + ' DROP COLUMN ' + pool.escapeId(columnName)
      ));
    }

    return operations;
  }

  _getMigratePrimaryKeyOperations(oldSchema) {
    const operations = [];
    const newSchema = this._schema;

    if (!isEqual(newSchema.primaryKey, oldSchema.primaryKey)) {
      if (oldSchema.primaryKey) {
        operations.push(Operation.create(
          Operation.Types.DROP_KEY,
          'ALTER TABLE ' + this._escapedName + ' DROP PRIMARY KEY'
        ));
      }
      if (newSchema.primaryKey) {
        const keySQL = this._generateKeySQL(KEY_TYPES.PRIMARY, newSchema.primaryKey);
        operations.push(Operation.create(
          Operation.Types.ADD_KEY,
          'ALTER TABLE ' + this._escapedName + ' ADD ' + keySQL
        ));
      }
    }

    return operations;
  }

  _getMigrateUniqueKeysOperations(oldSchema) {
    const operations = [];
    const diff = diffKeys(oldSchema.uniqueKeys || [], this._schema.uniqueKeys || []);
    const removedKeys = diff.removedKeys;
    const addedKeys = diff.addedKeys;
    var i;

    for (i = 0; i < removedKeys.length; i++) {
      const keyName = this._createKeyName(KEY_TYPES.UNIQUE, removedKeys[i]);
      operations.push(Operation.create(
        Operation.Types.DROP_KEY,
        'ALTER TABLE ' + this._escapedName + ' DROP KEY ' + this._pool.escapeId(keyName)
      ));
    }

    for (i = 0; i < addedKeys.length; i++) {
      const keySQL = this._generateKeySQL(KEY_TYPES.UNIQUE, addedKeys[i]);
      operations.push(Operation.create(
        Operation.Types.ADD_KEY,
        'ALTER TABLE ' + this._escapedName + ' ADD ' + keySQL
      ));
    }

    return operations;
  }

  _getMigrateIndexesOperations(oldSchema) {
    const operations = [];
    const diff = diffKeys(oldSchema.indexes || [], this._schema.indexes || []);
    const removedKeys = diff.removedKeys;
    const addedKeys = diff.addedKeys;
    var i;

    for (i = 0; i < removedKeys.length; i++) {
      const keyName = this._createKeyName(KEY_TYPES.INDEX, removedKeys[i]);
      operations.push(Operation.create(
        Operation.Types.DROP_KEY,
        'ALTER TABLE ' + this._escapedName + ' DROP KEY ' + this._pool.escapeId(keyName)
      ));
    }

    for (i = 0; i < addedKeys.length; i++) {
      const keySQL = this._generateKeySQL(KEY_TYPES.INDEX, addedKeys[i]);
      operations.push(Operation.create(
        Operation.Types.ADD_KEY,
        'ALTER TABLE ' + this._escapedName + ' ADD ' + keySQL
      ));
    }

    return operations;
  }

  _getMigrateForeignKeysOperations(oldSchema) {
    const operations = [];
    const oldForeignKeys = oldSchema.foreignKeys;
    const newForeignKeys = this._schema.foreignKeys;
    var columnNames;

    for (columnNames in oldForeignKeys) {
      if (isEqual(oldForeignKeys[columnNames], newForeignKeys[columnNames])) {
        continue;
      }
      columnNames = columnNames.split(','); // Don't need /\s*,\s*/ regex since this value was created internally
      const keyName = this._createKeyName(KEY_TYPES.FOREIGN, columnNames);
      operations.push(Operation.create(
        Operation.Types.DROP_FOREIGN_KEY,
        'ALTER TABLE ' + this._escapedName + ' DROP FOREIGN KEY ' + this._pool.escapeId(keyName)
      ));
    }

    for (columnNames in newForeignKeys) {
      const newForeignKeyData = newForeignKeys[columnNames];
      if (isEqual(newForeignKeyData, oldForeignKeys[columnNames])) {
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
      columnNames = columnNames.split(','); // Don't need /\s*,\s*/ regex since this value was created internally
      const keyName = this._createKeyName(KEY_TYPES.FOREIGN, columnNames);
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
        'ALTER TABLE ' + this._escapedName + ' ENGINE=' + newSchema.engine
      ));
    }

    // AUTO_INCREMENT
    if (
      typeof newSchema.autoIncrement === 'number' &&
      (typeof oldSchema.autoIncrement !== 'number' || newSchema.autoIncrement > oldSchema.autoIncrement)
    ) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'ALTER TABLE ' + this._escapedName + ' AUTO_INCREMENT=' + newSchema.autoIncrement
      ));
    }

    // [DEFAULT] CHARACTER SET
    if (newSchema.charset && newSchema.charset !== oldSchema.charset) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'ALTER TABLE ' + this._escapedName + ' CHARSET=' + newSchema.charset
      ));
    }

    // [DEFAULT] COLLATE
    if (newSchema.collate && newSchema.collate !== oldSchema.collate) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'ALTER TABLE ' + this._escapedName + ' COLLATE=' + newSchema.collate
      ));
    }

    // COMPRESSION
    if (newSchema.compression && newSchema.compression !== oldSchema.compression) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'ALTER TABLE ' + this._escapedName + ' COMPRESSION=' + this._pool.escape(newSchema.compression)
      ));
    }

    // ROW_FORMAT
    if (newSchema.rowFormat && newSchema.rowFormat !== oldSchema.rowFormat) {
      operations.push(Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'ALTER TABLE ' + this._escapedName + ' ROW_FORMAT=' + newSchema.rowFormat
      ));
    }

    return operations;
  }

  _schemaToSQL() {
    const pool = this._pool;
    const schema = this._schema;

    var sql = 'CREATE TABLE ' + this._escapedName + ' (';

    const columns = schema.columns;
    for (const columnName in columns) {
      sql += pool.escapeId(columnName) + ' ' + columns[columnName].$toSQL() + ',';
    }

    if (schema.primaryKey) {
      sql += this._generateKeySQL(KEY_TYPES.PRIMARY, schema.primaryKey) + ',';
    }

    if (schema.uniqueKeys) {
      for (let i = 0; i < schema.uniqueKeys.length; i++) {
        sql += this._generateKeySQL(KEY_TYPES.UNIQUE, schema.uniqueKeys[i]) + ',';
      }
    }

    if (schema.indexes) {
      for (let i = 0; i < schema.indexes.length; i++) {
        sql += this._generateKeySQL(KEY_TYPES.INDEX, schema.indexes[i]) + ',';
      }
    }

    // Foreign keys are handled separately because they should not be
    // in the initial CREATE TABLE statement in case the tables being
    // referenced haven't been created yet

    sql = sql.slice(0, -1) + ')'; // Need to slice off the trailing ','

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

    if (type === KEY_TYPES.UNIQUE) {
      return 'unique_' + this.name + '_' + columns;
    }
    if (type === KEY_TYPES.INDEX) {
      return 'index_' + this.name + '_' + columns;
    }
    // type === KEY_TYPES.FOREIGN
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

    if (type === KEY_TYPES.PRIMARY) {
      sql += 'PRIMARY KEY';
    } else if (type === KEY_TYPES.UNIQUE) {
      sql += 'UNIQUE KEY ' + pool.escapeId(this._createKeyName(type, columns));
    } else { // KEY_TYPES.INDEX
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
    columns = columns.split(/\s*,\s*/);
    const pool = this._pool;

    var sql = 'CONSTRAINT ' + pool.escapeId(this._createKeyName(KEY_TYPES.FOREIGN, columns)) +
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
  const normalizedSchema = Object.assign({}, schema, {
    uniqueKeys: cloneDeep(schema.uniqueKeys),
    indexes: cloneDeep(schema.indexes),
    foreignKeys: cloneDeep(schema.foreignKeys),
  });
  normalizeKeys(normalizedSchema);
  return normalizedSchema;
}

/**
 * Normalizes keys so that they can be properly used for table
 * creation and properly compared for table migration.
 *
 * @private
 * @param {Object} schema
 * @returns {void}
 */
function normalizeKeys(schema) {
  // Make sure primary key columns are not null
  const primaryKey = schema.primaryKey;
  if (primaryKey) {
    if (primaryKey instanceof Array) {
      for (var i = 0; i < primaryKey.length; i++) {
        schema.columns[primaryKey[i]].notNull();
      }
    } else {
      schema.columns[primaryKey].notNull();
    }
  }

  // Move keys defined in the columns to the schema body
  const columns = schema.columns;
  for (const columnName in columns) {
    const column = columns[columnName];
    if (column.$primaryKey) {
      schema.primaryKey = columnName;
    }
    if (column.$unique) {
      schema.uniqueKeys = schema.uniqueKeys || [];
      schema.uniqueKeys.push(columnName);
    }
    if (column.$index) {
      schema.indexes = schema.indexes || [];
      schema.indexes.push(columnName);
    }
  }

  const foreignKeys = schema.foreignKeys;
  if (!foreignKeys) {
    return;
  }
  const standardizedForeignKeys = {};
  for (const keyColumns in foreignKeys) {
    var foreignKeyData = foreignKeys[keyColumns];
    if (typeof foreignKeyData === 'string') {
      const foreignKeyParts = foreignKeyData.split('.');
      foreignKeyData = {
        table: foreignKeyParts[0],
        column: foreignKeyParts[1],
        onDelete: undefined,
        onUpdate: undefined,
      };
    }
    // RESTRICT is the default and doesn't show up in CREATE TABLE statements, so don't use it
    // Also, make sure the data object has the onDelete and onUpdate keys
    if (!foreignKeyData.onDelete || foreignKeyData.onDelete.toUpperCase() === 'RESTRICT') {
      foreignKeyData.onDelete = undefined;
    }
    if (!foreignKeyData.onUpdate || foreignKeyData.onUpdate.toUpperCase() === 'RESTRICT') {
      foreignKeyData.onUpdate = undefined;
    }
    const standardizedKeyColumns = keyColumns.replace(/\s+/g, ''); // "a,b" is standard, "a, b" is not
    standardizedForeignKeys[standardizedKeyColumns] = foreignKeyData;
  }
  schema.foreignKeys = standardizedForeignKeys;
}

function sqlToSchema(sql) {
  const createTableParts = /^\s*CREATE(?: TEMPORARY)? TABLE.*?`(\w+)`\s*\(([\S\s]+)\)(.*)/.exec(sql);
  const tableName = createTableParts[1];
  const createDefinitions = createTableParts[2].split(/,[\r\n]+/);
  const tableOptions = createTableParts[3];

  const schema = {
    name: tableName,
    columns: generateColumnSchema(createDefinitions),
    primaryKey: generatePrimaryKeySchema(createDefinitions),
    uniqueKeys: generateUniqueKeysSchema(createDefinitions),
    indexes: generateIndexesSchema(createDefinitions),
    foreignKeys: generateForegnKeysSchema(createDefinitions),
  };

  let match = /ENGINE=(\w+)/.exec(tableOptions);
  if (match) {
    schema.engine = match[1];
  }

  match = /AUTO_INCREMENT=(\d+)/.exec(tableOptions);
  if (match) {
    schema.autoIncrement = +match[1];
  }

  match = /DEFAULT CHARSET=(\w+)/.exec(tableOptions);
  if (match) {
    schema.charset = match[1];
  }

  match = /COLLATE=(\w+)/.exec(tableOptions);
  if (match) {
    schema.collate = match[1];
  }

  match = /COMPRESSION='(\w+)'/.exec(tableOptions);
  if (match) {
    schema.compression = match[1];
  }

  match = /ROW_FORMAT=(\w+)/.exec(tableOptions);
  if (match) {
    schema.rowFormat = match[1];
  }

  return schema;
}

function generateColumnSchema(createDefinitions) {
  const columns = {};
  const rgxNameAndType = /^`(\w+)` (\w+)(?:\((.+?)\))?/; // Corner case: enum or set contains string with ')'
  const rgxDefault = / DEFAULT (?:(\d+\.\d+|\w+)|'((?:''|[^'])*?)'(?!'))/;
  const rgxCharset = / CHARACTER SET (\w+)/;
  const rgxCollate = / COLLATE (\w+)/;

  for (var i = 0; i < createDefinitions.length; i++) {
    const definitionSQL = createDefinitions[i].trim();
    if (definitionSQL[0] !== '`') {
      continue;
    }

    const nameAndType = rgxNameAndType.exec(definitionSQL);
    const name = nameAndType[1];
    const type = nameAndType[2];
    var typeData;
    if (type === 'enum' || type === 'set') {
      // `'A','B','C'` => ['A', 'B', 'C']
      typeData = nameAndType[3].slice(1, -1).split('\',\'');
    } else if (nameAndType[3]) {
      typeData = nameAndType[3].split(',').map(x => +x); // Convert each to a number
    } else {
      typeData = [];
    }
    const columnDefintion = ColumnDefinitions[type].apply(null, typeData);

    if (definitionSQL.indexOf(' NOT NULL') >= 0) {
      columnDefintion.notNull();
    }
    if (definitionSQL.indexOf(' AUTO_INCREMENT') >= 0) {
      columnDefintion.autoIncrement();
    }
    if (definitionSQL.indexOf(' unsigned') >= 0) {
      columnDefintion.unsigned();
    }
    if (definitionSQL.indexOf(' zerofill') >= 0) {
      columnDefintion.zerofill();
    }
    if (
      (type === 'datetime' || type === 'timestamp') &&
      definitionSQL.indexOf(' ON UPDATE CURRENT_TIMESTAMP') >= 0
    ) {
      columnDefintion.onUpdateCurrentTimestamp();
    }

    var match = rgxDefault.exec(definitionSQL);
    if (match) {
      if (match[1] === 'NULL') {
        columnDefintion.default(null);
      } else {
        columnDefintion.default(match[1] || match[2]);
      }
    }

    match = rgxCharset.exec(definitionSQL);
    if (match) {
      columnDefintion.charset(match[1]);
    }

    match = rgxCollate.exec(definitionSQL);
    if (match) {
      columnDefintion.collate(match[1]);
    }

    columns[name] = columnDefintion;
  }

  return columns;
}

function columnsSQLToSchema(sql) {
  const schema = sql.replace(/`|\s/g, '');
  return schema.indexOf(',') >= 0 ? schema.split(',') : schema;
}

function generatePrimaryKeySchema(createDefinitions) {
  const rgxPrimaryKey = /^\s*PRIMARY KEY \((.*?)\)/;

  for (var i = 0; i < createDefinitions.length; i++) {
    var pkMatch = rgxPrimaryKey.exec(createDefinitions[i]);
    if (pkMatch) {
      return columnsSQLToSchema(pkMatch[1]);
    }
  }

  return null;
}

function generateUniqueKeysSchema(createDefinitions) {
  const keys = [];
  const rgxUniqueKey = /^\s*UNIQUE KEY `\w+` \((.*?)\)/;

  for (var i = 0; i < createDefinitions.length; i++) {
    const keyMatch = rgxUniqueKey.exec(createDefinitions[i]);
    if (keyMatch) {
      keys.push(columnsSQLToSchema(keyMatch[1]));
    }
  }

  return keys.length ? keys : null;
}

function generateIndexesSchema(createDefinitions) {
  const indexes = [];
  const rgxIndex = /^\s*(?:INDEX|KEY) `\w+` \((.*?)\)/;

  for (var i = 0; i < createDefinitions.length; i++) {
    const indexMatch = rgxIndex.exec(createDefinitions[i]);
    if (indexMatch) {
      indexes.push(columnsSQLToSchema(indexMatch[1]));
    }
  }

  return indexes.length ? indexes : null;
}

function generateForegnKeysSchema(createDefinitions) {
  const foreignKeys = {};
  const rgxForeignKey =
    /\s*CONSTRAINT `\w+` FOREIGN KEY \(`(.*?)`\) REFERENCES `(\w+)` \((.*?)\)(?: ON DELETE (RESTRICT|CASCADE|SET NULL|NO ACTION))?(?: ON UPDATE (RESTRICT|CASCADE|SET NULL|NO ACTION))?/;

  for (var i = 0; i < createDefinitions.length; i++) {
    const keyMatch = rgxForeignKey.exec(createDefinitions[i]);
    if (!keyMatch) {
      continue;
    }

    const keyColumns = columnsSQLToSchema(keyMatch[1]);
    foreignKeys[keyColumns] = {
      table: keyMatch[2],
      column: columnsSQLToSchema(keyMatch[3]),
      onDelete: keyMatch[4],
      onUpdate: keyMatch[5],
    };
  }

  return isEmpty(foreignKeys) ? null : foreignKeys;
}

module.exports = TableDefinition;
