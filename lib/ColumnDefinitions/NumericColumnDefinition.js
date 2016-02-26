'use strict';

const ColumnDefinition = require('./ColumnDefinition');

class NumericColumnDefinition extends ColumnDefinition {
  constructor(type, m, d) {
    super(type, m, d);
    this._unsigned = false;
    this._zerofill = false;
    this._autoIncrement = false;
  }

  unsigned() {
    this._unsigned = true;
    return this;
  }

  zerofill() {
    this._unsigned = true;
    this._zerofill = true;
    return this;
  }

  autoIncrement() {
    this._autoIncrement = true;
    return this;
  }

  $equals(columnDefinition) {
    return super.$equals(columnDefinition) &&
      this._unsigned === columnDefinition._unsigned &&
      this._zerofill === columnDefinition._zerofill &&
      this._autoIncrement === columnDefinition._autoIncrement;
  }

  __getType() {
    var type = this.$type;
    if (this._unsigned) {
      type += ' unsigned';
    }
    if (this._zerofill) {
      type += ' zerofill';
    }
    if (this._autoIncrement) {
      type += ' AUTO_INCREMENT';
    }
    return type;
  }
}

module.exports = NumericColumnDefinition;
