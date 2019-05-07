/**
 * ColumnDefinitions
 *
 * Reference: http://dev.mysql.com/doc/refman/5.7/en/data-type-overview.html
 */
'use strict';

const ColumnDefinition = require('./ColumnDefinition');
const GeometricalColumnDefinition = require('./GeometricalColumnDefinition');
const NumericColumnDefinition = require('./NumericColumnDefinition');
const TextColumnDefinition = require('./TextColumnDefinition');
const TimestampColumnDefinition = require('./TimestampColumnDefinition');
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
    return new NumericColumnDefinition('int', m);
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
    return new NumericColumnDefinition('decimal', m, d);
  },
  numeric(m, d) {
    return new NumericColumnDefinition('decimal', m, d);
  },
  fixed(m, d) {
    return new NumericColumnDefinition('decimal', m, d);
  },
  bit(m) {
    return new ColumnDefinition('bit', m);
  },
  bool() {
    return new NumericColumnDefinition('tinyint', 1);
  },
  boolean() {
    return new NumericColumnDefinition('tinyint', 1);
  },
  date() {
    return new ColumnDefinition('date');
  },
  datetime(m) {
    return new UpdatableTimeColumnDefinition('datetime', m);
  },
  timestamp(m) {
    return new TimestampColumnDefinition(m);
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
    if (m === undefined) {
      throw new Error('The varchar `m` argument must be specified');
    }
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
    if (m === undefined) {
      throw new Error('The varbinary `m` argument must be specified');
    }
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
  enum(...values) {
    if (values.length === 0) {
      throw new Error('At least one enum value must be provided');
    }
    return new TextColumnDefinition('enum', values);
  },
  set(...values) {
    if (values.length === 0) {
      throw new Error('At least one set value must be provided');
    }
    return new TextColumnDefinition('set', values);
  },
  json() {
    return new ColumnDefinition('json');
  },
  geometry() {
    return new GeometricalColumnDefinition('geometry');
  },
  point() {
    return new GeometricalColumnDefinition('point');
  },
  linestring() {
    return new GeometricalColumnDefinition('linestring');
  },
  polygon() {
    return new GeometricalColumnDefinition('polygon');
  },
  multipoint() {
    return new GeometricalColumnDefinition('multipoint');
  },
  multilinestring() {
    return new GeometricalColumnDefinition('multilinestring');
  },
  multipolygon() {
    return new GeometricalColumnDefinition('multipolygon');
  },
  geometrycollection() {
    return new GeometricalColumnDefinition('geometrycollection');
  },
};

module.exports = ColumnDefinitions;
