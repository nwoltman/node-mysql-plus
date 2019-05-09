/**
 * KeyDefinitions
 */
'use strict';

const ForeignKeyDefinition = require('./ForeignKeyDefinition');
const IndexKeyDefinition = require('./IndexKeyDefinition');

function throwIfNoColumns(columns) {
  if (columns.length === 0) {
    throw new Error('Cannot create a key with 0 columns');
  }
}

const KeyDefinitions = {
  index(...columns) {
    throwIfNoColumns(columns);
    return new IndexKeyDefinition('INDEX', 'idx', columns);
  },
  uniqueIndex(...columns) {
    throwIfNoColumns(columns);
    return new IndexKeyDefinition('UNIQUE INDEX', 'uniq', columns);
  },
  spatialIndex(...columns) {
    throwIfNoColumns(columns);
    return new IndexKeyDefinition('SPATIAL INDEX', 'sptl', columns);
  },
  fulltextIndex(...columns) {
    throwIfNoColumns(columns);
    return new IndexKeyDefinition('FULLTEXT INDEX', 'fltxt', columns);
  },
  foreignKey(...columns) {
    throwIfNoColumns(columns);
    return new ForeignKeyDefinition(columns);
  },
};

module.exports = KeyDefinitions;
