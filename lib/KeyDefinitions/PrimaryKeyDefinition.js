'use strict';

const arraysEqual = require('../utils/arraysEqual');
const parseKeyParts = require('../utils/parseKeyParts');

class PrimaryKeyDefinition {
  constructor(keyParts) {
    const {columnNames, formattedKeyParts} = parseKeyParts(keyParts);
    this.$columnNames = columnNames;
    this._keyParts = formattedKeyParts;
  }

  $equals(otherKey) {
    return arraysEqual(this._keyParts, otherKey._keyParts);
  }

  $toSQL() {
    return `PRIMARY KEY (${this._keyParts.join(', ')})`;
  }
}

module.exports = PrimaryKeyDefinition;
