'use strict';

const ColumnDefinition = require('./ColumnDefinition');

class GeometryColumnDefinition extends ColumnDefinition {
  constructor(type) {
    super(type);
    this.$spatialIndex = false;
  }

  spatialIndex() {
    this.$spatialIndex = true;
    return this;
  }
}

module.exports = GeometryColumnDefinition;
