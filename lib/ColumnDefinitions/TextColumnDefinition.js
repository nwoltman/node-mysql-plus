'use strict';

const ColumnDefinition = require('./ColumnDefinition');

class TextColumnDefinition extends ColumnDefinition {
  constructor(type, m) {
    super(type, m);
    this.$fulltextIndex = false;
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

  fulltextIndex() {
    this.$fulltextIndex = true;
    return this;
  }

  $equals(columnDefinition, columnTableSchema) {
    if (!super.$equals(columnDefinition)) {
      return false;
    }

    if (
      this._collate && columnDefinition._collate &&
      this._collate === columnDefinition._collate
    ) {
      return true;
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

  __getExtendedType() {
    var extendedType = '';
    if (this._charset) {
      extendedType += ' CHARACTER SET ' + this._charset;
    }
    if (this._collate) {
      extendedType += ' COLLATE ' + this._collate;
    }
    return extendedType;
  }
}

module.exports = TextColumnDefinition;
