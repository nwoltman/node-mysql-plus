'use strict';

const ColumnDefinition = require('./ColumnDefinition');

class TextColumnDefinition extends ColumnDefinition {
  constructor(type, m) {
    super(type, m);
    this._charset = null;
    this._collate = null;
  }

  charset(value) {
    this._charset = value;
    return this;
  }

  collate(value) {
    this._collate = value;
    return this;
  }

  $equals(columnDefinition, columnTableSchema) {
    if (!super.$equals(columnDefinition)) {
      return false;
    }

    if (
      this._charset !== columnDefinition._charset &&
      (columnDefinition._charset || this._charset !== columnTableSchema.charset)
    ) {
      return false;
    }

    if (
      this._collate !== columnDefinition._collate &&
      (this._collate || columnDefinition._collate !== columnTableSchema.collate)
    ) {
      return false;
    }

    return true;
  }

  __getType() {
    var type = this.$type;
    if (this._charset) {
      type += ' CHARACTER SET ' + this._charset;
    }
    if (this._collate) {
      type += ' COLLATE ' + this._collate;
    }
    return type;
  }
}

module.exports = TextColumnDefinition;
