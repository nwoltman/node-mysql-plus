'use strict';

const arraysEqual = require('../utils/arraysEqual');
const {escapeId} = require('mysql/lib/protocol/SqlString');

class IndexKeyDefinition {
  constructor(type, namePrefix, columns) {
    this.$name = namePrefix + '_' + columns.join('_');
    this._type = type;
    this._columns = columns;
  }

  name(name) {
    this.$name = name;
    return this;
  }

  $equals(otherKey) {
    return this._type === otherKey._type &&
      this.$name === otherKey.$name &&
      arraysEqual(this._columns, otherKey._columns);
  }

  $toSQL() {
    return `${this._type} ${escapeId(this.$name)} (${escapeId(this._columns)})`;
  }
}

module.exports = IndexKeyDefinition;
