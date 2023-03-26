'use strict';

const arraysEqual = require('../utils/arraysEqual');
const {escapeId} = require('sqlstring');
const parseKeyParts = require('../utils/parseKeyParts');

class IndexKeyDefinition {
  constructor(type, namePrefix, keyParts) {
    const {columnNames, formattedKeyParts} = parseKeyParts(keyParts);
    this.$name = namePrefix + '_' + columnNames.join('_');
    this._type = type;
    this._keyParts = formattedKeyParts;
  }

  name(name) {
    this.$name = name;
    return this;
  }

  $equals(otherKey) {
    return this._type === otherKey._type &&
      this.$name === otherKey.$name &&
      arraysEqual(this._keyParts, otherKey._keyParts);
  }

  $toSQL() {
    return `${this._type} ${escapeId(this.$name)} (${this._keyParts.join(', ')})`;
  }
}

module.exports = IndexKeyDefinition;
