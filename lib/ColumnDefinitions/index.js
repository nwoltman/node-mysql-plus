/**
 * ColumnDefinitions
 */

// Reference: http://dev.mysql.com/doc/refman/5.7/en/data-type-overview.html

'use strict';

const ColumnDefinition = require('./ColumnDefinition');
const NumericColumnDefinition = require('./NumericColumnDefinition');
const TextColumnDefinition = require('./TextColumnDefinition');
const UpdatableTimeColumnDefinition = require('./UpdatableTimeColumnDefinition');

const ColumnDefinitions = {
  tinyint(m) {
    return new NumericColumnDefinition('tinyint', m);
  },
  smallint(m) {
    return new NumericColumnDefinition('smallint', m);
  },
  mediumint(m) {
    return new NumericColumnDefinition('mediumint', m);
  },
  int(m) {
    return new NumericColumnDefinition('int', m);
  },
  integer(m) {
    return new NumericColumnDefinition('integer', m);
  },
  bigint(m) {
    return new NumericColumnDefinition('bigint', m);
  },
  float(m, d) {
    return new NumericColumnDefinition('float', m, d);
  },
  double(m, d) {
    return new NumericColumnDefinition('double', m, d);
  },
  decimal(m, d) {
    return new NumericColumnDefinition('decimal', m, d);
  },
  dec(m, d) {
    return new NumericColumnDefinition('dec', m, d);
  },
  numeric(m, d) {
    return new NumericColumnDefinition('numeric', m, d);
  },
  fixed(m, d) {
    return new NumericColumnDefinition('fixed', m, d);
  },
  bit(m) {
    return new ColumnDefinition('bit', m);
  },
  bool() {
    return new ColumnDefinition('bool');
  },
  boolean() {
    return new ColumnDefinition('boolean');
  },
  date() {
    return new ColumnDefinition('date');
  },
  datetime(m) {
    return new UpdatableTimeColumnDefinition('datetime', m);
  },
  timestamp(m) {
    return new UpdatableTimeColumnDefinition('timestamp', m);
  },
  time(m) {
    return new ColumnDefinition('time', m);
  },
  year() {
    return new ColumnDefinition('year');
  },
  char(m) {
    return new TextColumnDefinition('char', m);
  },
  varchar(m) {
    return new TextColumnDefinition('varchar', m);
  },
  text(m) {
    return new TextColumnDefinition('text', m);
  },
  tinytext() {
    return new TextColumnDefinition('tinytext');
  },
  mediumtext() {
    return new TextColumnDefinition('mediumtext');
  },
  longtext() {
    return new TextColumnDefinition('longtext');
  },
  binary(m) {
    return new ColumnDefinition('binary', m);
  },
  varbinary(m) {
    return new ColumnDefinition('varbinary', m);
  },
  blob(m) {
    return new ColumnDefinition('blob', m);
  },
  tinyblob() {
    return new ColumnDefinition('tinyblob');
  },
  mediumblob() {
    return new ColumnDefinition('mediumblob');
  },
  longblob() {
    return new ColumnDefinition('longblob');
  },
  enum() {
    const argsLength = arguments.length;
    if (!argsLength) {
      throw new Error('You must provide at least one possible enum value');
    }
    const values = new Array(argsLength);
    for (var i = 0; i < argsLength; i++) {
      values[i] = arguments[i];
    }
    return new TextColumnDefinition('enum', values);
  },
  set() {
    const argsLength = arguments.length;
    if (!argsLength) {
      throw new Error('You must provide at least one possible set value');
    }
    const values = new Array(argsLength);
    for (var i = 0; i < argsLength; i++) {
      values[i] = arguments[i];
    }
    return new TextColumnDefinition('set', values);
  },
};

module.exports = ColumnDefinitions;
