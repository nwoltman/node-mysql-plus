'use strict';

const mysql = require('mysql');

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
    this._default = value;
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
    return thisType === otherType &&
      this._notNull === columnDefinition._notNull &&
      (this._default === columnDefinition._default ||
       (this._notNull ? false : this._default == null && columnDefinition._default == null));
    // Don't need to worry about keys since those are handled on the schema body
  }

  $toSQL() {
    var sql = this.__getType();
    if (this._notNull) {
      sql += ' NOT NULL';
    }
    if (this._default !== undefined) {
      if (
        this._default === 'CURRENT_TIMESTAMP' &&
        (this._baseType === 'timestamp' || this._baseType === 'datetime')
      ) {
        sql += ' DEFAULT CURRENT_TIMESTAMP';
      } else {
        sql += ' DEFAULT ' + mysql.escape(this._default);
      }
    }
    return sql;
  }

  __getType() {
    return this.$type;
  }
}

module.exports = ColumnDefinition;
