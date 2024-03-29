'use strict';

const arraysEqual = require('../utils/arraysEqual');
const {escapeId} = require('mysql/lib/protocol/SqlString');

const referenceOptions = ['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION'];

function sanitizeReferenceOption(option) {
  const refOption = option.toUpperCase();
  if (referenceOptions.indexOf(refOption) === -1) {
    throw new Error('Invalid foreign key reference option: ' + option);
  }

  // NO ACTION is the same as RESTRICT in MySQL 8
  // https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html#foreign-key-referential-actions
  if (refOption === 'NO ACTION') {
    return 'RESTRICT';
  }

  return refOption;
}

class ForeignKeyDefinition {
  constructor(columns) {
    this.$columns = columns;
    this._name = 'fk_' + columns.join('_');
    this._nameManuallySet = false;
    this._tableName = '';
    this._referenceTable = null;
    this._referenceColumns = null;
    this._onDelete = 'RESTRICT';
    this._onUpdate = 'RESTRICT';
  }

  references(table, columns) {
    this._referenceTable = table;
    this._referenceColumns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  onDelete(option) {
    this._onDelete = sanitizeReferenceOption(option);
    return this;
  }

  onUpdate(option) {
    this._onUpdate = sanitizeReferenceOption(option);
    return this;
  }

  cascade() {
    this._onDelete = this._onUpdate = 'CASCADE';
    return this;
  }

  name(name) {
    this._name = name;
    this._nameManuallySet = true;
    return this;
  }

  get $name() {
    return this._nameManuallySet
      ? this._name
      : this._name + '_' + this._tableName;
  }

  // The table name is used to help ensure that the foreign key's constraint name will be unique
  $setTableName(tableName) {
    this._tableName = tableName;
  }

  $equals(otherKey) {
    return this.$name === otherKey.$name &&
      arraysEqual(this.$columns, otherKey.$columns) &&
      this._referenceTable === otherKey._referenceTable &&
      arraysEqual(this._referenceColumns, otherKey._referenceColumns) &&
      this._onDelete === otherKey._onDelete &&
      this._onUpdate === otherKey._onUpdate;
  }

  $toSQL() {
    let sql =
      `CONSTRAINT ${escapeId(this.$name)}\n  FOREIGN KEY (${escapeId(this.$columns)}) ` +
      `REFERENCES ${escapeId(this._referenceTable)} (${escapeId(this._referenceColumns)})`;

    // RESTRICT and NO ACTION are equivalent to omitting the clause:
    // https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html#foreign-key-referential-actions
    // (NO ACTION is transformed into RESTRICT above because it's basically an alias in MySQL 8)
    if (this._onDelete !== 'RESTRICT') {
      sql += ' ON DELETE ' + this._onDelete;
    }
    if (this._onUpdate !== 'RESTRICT') {
      sql += ' ON UPDATE ' + this._onUpdate;
    }

    return sql;
  }
}

module.exports = ForeignKeyDefinition;
