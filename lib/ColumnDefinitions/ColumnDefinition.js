'use strict';

const mysql = require('mysql');
const util = require('util');

const warnDeprecatedDefault = util.deprecate(
  () => { /* no-op */ },
  'Calling `.default(\'CURRENT_TIMESTAMP\')` has been deprecated because `.default()` will always escape values ' +
   'starting in version 0.5.0. Please use `.defaultRaw(\'CURRENT_TIMESTAMP\')` instead.'
);

class ColumnDefinition {
  constructor(type, m, d) {
    this._baseType = type;
    if (m == null) {
      this.$hasLength = false;
    } else {
      this.$hasLength = true;
      type += '(' + mysql.escape(m) + (d == null ? '' : ',' + mysql.escape(d)) + ')';
    }
    this.$type = type;
    this.$primaryKey = false;
    this.$unique = false;
    this.$index = false;
    this.$oldName = null;
    this._notNull = false;
    this._default = undefined;
  }

  primaryKey() {
    this.$primaryKey = true;
    this._notNull = true;
    return this;
  }

  unique() {
    this.$unique = true;
    return this;
  }

  index() {
    this.$index = true;
    return this;
  }

  notNull() {
    this._notNull = true;
    return this;
  }

  default(value) {
    if (
      value === 'CURRENT_TIMESTAMP' &&
      (this._baseType === 'timestamp' || this._baseType === 'datetime')
    ) {
      warnDeprecatedDefault();
      return this.defaultRaw(value);
    }

    this._default = mysql.escape(value);
    return this;
  }

  defaultRaw(value) {
    if (typeof value !== 'string') {
      throw new TypeError(
        'The value passed to `.defaultRaw()` must be a string. You should use `.default()` for other types of values.'
      );
    }

    this._default = value;
    return this;
  }

  oldName(oldName) {
    this.$oldName = oldName;
    return this;
  }

  $equals(columnDefinition) {
    var thisType = this.$type;
    var otherType = columnDefinition.$type;

    if (this.$hasLength && columnDefinition.$hasLength) {
      thisType = this.$type;
      otherType = columnDefinition.$type;
    } else {
      thisType = this._baseType;
      otherType = columnDefinition._baseType;
    }

    if (thisType !== otherType || this._notNull !== columnDefinition._notNull) {
      return false;
    }
    if (this._default === columnDefinition._default) {
      return true;
    }
    if (this._notNull) {
      return false;
    }

    return (this._default === 'NULL' || this._default === undefined) &&
      (columnDefinition._default === 'NULL' || columnDefinition._default === undefined);
    // Don't need to worry about keys since those are handled on the schema body
    // The old column name also does not contribute to the equality of the column definitions
  }

  $toSQL() {
    var sql = this.__getType();

    if (this._notNull) {
      sql += ' NOT NULL';
    }
    if (this._default !== undefined) {
      sql += ' DEFAULT ' + this._default;
    }

    return sql;
  }

  __getType() {
    return this.$type;
  }
}

module.exports = ColumnDefinition;
