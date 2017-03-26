'use strict';

const mysql = require('mysql');

function escapeDefault(value) {
  if (typeof value === 'boolean') {
    return value ? "'1'" : "'0'";
  }
  if (typeof value === 'number') {
    return "'" + value + "'";
  }

  return mysql.escape(value);
}

class ColumnDefinition {
  constructor(type, m, d) {
    this._baseType = type;
    if (m == null) {
      this.$hasLength = false;
      this._type = type;
    } else {
      this.$hasLength = true;
      this._type = type + '(' + mysql.escape(m) + (d == null ? '' : ',' + mysql.escape(d)) + ')';
    }
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
    this._default = escapeDefault(value);
    return this;
  }

  oldName(oldName) {
    this.$oldName = oldName;
    return this;
  }

  $defaultRaw(value) {
    this._default = value;
    return this;
  }

  $equals(columnDefinition) {
    var thisType = this._type;
    var otherType = columnDefinition._type;

    if (this.$hasLength && columnDefinition.$hasLength) {
      thisType = this._type;
      otherType = columnDefinition._type;
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
    var sql = this._type + this.__getExtendedType();

    if (this._notNull) {
      sql += ' NOT NULL';
    }
    if (this._default !== undefined) {
      sql += ' DEFAULT ' + this._default;
    }

    return sql;
  }

  __getExtendedType() {
    return '';
  }
}

module.exports = ColumnDefinition;
