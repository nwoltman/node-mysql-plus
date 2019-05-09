'use strict';

const arraysEqual = require('../utils/arraysEqual');
const {escapeId} = require('mysql/lib/protocol/SqlString');

class PrimaryKeyDefinition {
  constructor(columns) {
    this._columns = columns;
  }

  $equals(otherKey) {
    return arraysEqual(this._columns, otherKey._columns);
  }

  $toSQL() {
    return `PRIMARY KEY (${escapeId(this._columns)})`;
  }
}

module.exports = PrimaryKeyDefinition;
