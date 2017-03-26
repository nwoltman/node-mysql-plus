'use strict';

const ColumnDefinition = require('./ColumnDefinition');

class UpdatableTimeColumnDefinition extends ColumnDefinition {
  constructor(type, m) {
    super(type, m);
    this._onUpdateCurrentTimestamp = false;
  }

  defaultCurrentTimestamp() {
    return this.$defaultRaw('CURRENT_TIMESTAMP');
  }

  onUpdateCurrentTimestamp() {
    this._onUpdateCurrentTimestamp = true;
    return this;
  }

  $equals(columnDefinition) {
    return super.$equals(columnDefinition) &&
      this._onUpdateCurrentTimestamp === columnDefinition._onUpdateCurrentTimestamp;
  }

  __getExtendedType() {
    return this._onUpdateCurrentTimestamp ? ' ON UPDATE CURRENT_TIMESTAMP' : '';
  }
}

module.exports = UpdatableTimeColumnDefinition;
