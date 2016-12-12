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

  __getType() {
    var type = this.$type;
    if (this._onUpdateCurrentTimestamp) {
      type += ' ON UPDATE CURRENT_TIMESTAMP';
    }
    return type;
  }
}

module.exports = UpdatableTimeColumnDefinition;
