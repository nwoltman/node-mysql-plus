'use strict';

const UpdatableTimeColumnDefinition = require('./UpdatableTimeColumnDefinition');

class TimestampColumnDefinition extends UpdatableTimeColumnDefinition {
  constructor(m) {
    super('timestamp', m);
    this._allowNull = true;
  }

  notNull() {
    this._allowNull = false;
    return super.notNull().defaultCurrentTimestamp();
  }

  default(value) {
    if (value === 0) {
      value = '0000-00-00 00:00:00';
    }
    return super.default(value);
  }

  $equals(columnDefinition) {
    return super.$equals(columnDefinition) &&
      this._allowNull === columnDefinition._allowNull;
  }

  __getExtendedType() {
    const extendedType = this._allowNull ? ' NULL' : '';
    return extendedType + super.__getExtendedType();
  }
}

module.exports = TimestampColumnDefinition;
