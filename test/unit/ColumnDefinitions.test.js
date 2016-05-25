'use strict';

const ColumnDefinitions = require('../../lib/ColumnDefinitions');

const should = require('should');

describe('ColumnDefinitions', () => {

  it('should correctly determine if two colums are equal', () => {
    var a;
    var b;

    a = ColumnDefinitions.tinyint();
    b = ColumnDefinitions.smallint();
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.blob();
    b = ColumnDefinitions.blob();
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.blob();
    b = ColumnDefinitions.blob().notNull();
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.blob().notNull();
    b = ColumnDefinitions.blob().notNull();
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.blob().default('a');
    b = ColumnDefinitions.blob();
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.blob().default('a');
    b = ColumnDefinitions.blob().default('a');
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.blob().notNull();
    b = ColumnDefinitions.blob().notNull().default('a');
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.blob().notNull().default('a');
    b = ColumnDefinitions.blob().notNull().default('b');
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.int().unsigned().zerofill().notNull().default(2).autoIncrement();
    b = ColumnDefinitions.int().unsigned().zerofill().notNull().default(2).autoIncrement();
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.int().unsigned().zerofill().notNull().default(2).autoIncrement();
    b = ColumnDefinitions.int().zerofill().notNull().default(2).autoIncrement();
    a.$equals(b).should.be.true(); // zerofill forces unsigned

    a = ColumnDefinitions.int().unsigned().zerofill().notNull().default(2).autoIncrement();
    b = ColumnDefinitions.int().unsigned().notNull().default(2).autoIncrement();
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.int().unsigned().zerofill().notNull().default(2);
    b = ColumnDefinitions.int().unsigned().zerofill().notNull().default(2).autoIncrement();
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.char().charset('utf8').collate('meh').notNull().default('a');
    b = ColumnDefinitions.char().charset('utf8').collate('meh').notNull().default('a');
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.char().charset('utf8');
    b = ColumnDefinitions.char().charset('utf8').collate('meh');
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.datetime().onUpdateCurrentTimestamp();
    b = ColumnDefinitions.datetime();
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.datetime().onUpdateCurrentTimestamp();
    b = ColumnDefinitions.datetime().onUpdateCurrentTimestamp();
    a.$equals(b).should.be.true();

    // Keys don't affect equality
    a = ColumnDefinitions.blob().index().unique();
    b = ColumnDefinitions.blob().index().unique();
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.blob().index();
    b = ColumnDefinitions.blob().unique();
    a.$equals(b).should.be.true();

    // Primary keys can affect equality since they force NOT NULL
    a = ColumnDefinitions.blob().primaryKey();
    b = ColumnDefinitions.blob().primaryKey();
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.blob().primaryKey();
    b = ColumnDefinitions.blob();
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.blob().primaryKey();
    b = ColumnDefinitions.blob().notNull();
    a.$equals(b).should.be.true();

    // Comparing columns with a length
    a = ColumnDefinitions.int(10);
    b = ColumnDefinitions.int();
    a.$equals(b).should.be.true();
    b.$equals(a).should.be.true();

    a = ColumnDefinitions.int(10);
    b = ColumnDefinitions.int(11);
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.float(2, 3);
    b = ColumnDefinitions.float();
    a.$equals(b).should.be.true();
    b.$equals(a).should.be.true();

    a = ColumnDefinitions.float(2, 3);
    b = ColumnDefinitions.float(3, 2);
    a.$equals(b).should.be.false();

    // Setting DEFAULT NULL is the same as omitting it when the column can be NULL
    a = ColumnDefinitions.int().default(null);
    b = ColumnDefinitions.int();
    a.$equals(b).should.be.true();
    b.$equals(a).should.be.true();
  });


  it('should provide functions to define all possible MySQL data types', () => {
    var cd;

    cd = ColumnDefinitions.tinyint();
    cd.$toSQL().should.equal('tinyint');

    cd = ColumnDefinitions.smallint();
    cd.$toSQL().should.equal('smallint');

    cd = ColumnDefinitions.mediumint();
    cd.$toSQL().should.equal('mediumint');

    cd = ColumnDefinitions.int();
    cd.$toSQL().should.equal('int');

    cd = ColumnDefinitions.integer();
    cd.$toSQL().should.equal('integer');

    cd = ColumnDefinitions.bigint();
    cd.$toSQL().should.equal('bigint');

    cd = ColumnDefinitions.float();
    cd.$toSQL().should.equal('float');

    cd = ColumnDefinitions.double();
    cd.$toSQL().should.equal('double');

    cd = ColumnDefinitions.decimal();
    cd.$toSQL().should.equal('decimal');

    cd = ColumnDefinitions.dec();
    cd.$toSQL().should.equal('dec');

    cd = ColumnDefinitions.numeric();
    cd.$toSQL().should.equal('numeric');

    cd = ColumnDefinitions.fixed();
    cd.$toSQL().should.equal('fixed');

    cd = ColumnDefinitions.bit();
    cd.$toSQL().should.equal('bit');

    cd = ColumnDefinitions.bool();
    cd.$toSQL().should.equal('bool');

    cd = ColumnDefinitions.boolean();
    cd.$toSQL().should.equal('boolean');

    cd = ColumnDefinitions.date();
    cd.$toSQL().should.equal('date');

    cd = ColumnDefinitions.datetime();
    cd.$toSQL().should.equal('datetime');

    cd = ColumnDefinitions.timestamp();
    cd.$toSQL().should.equal('timestamp');

    cd = ColumnDefinitions.time();
    cd.$toSQL().should.equal('time');

    cd = ColumnDefinitions.year();
    cd.$toSQL().should.equal('year');

    cd = ColumnDefinitions.char();
    cd.$toSQL().should.equal('char');

    cd = ColumnDefinitions.varchar();
    cd.$toSQL().should.equal('varchar');

    cd = ColumnDefinitions.text();
    cd.$toSQL().should.equal('text');

    cd = ColumnDefinitions.tinytext();
    cd.$toSQL().should.equal('tinytext');

    cd = ColumnDefinitions.mediumtext();
    cd.$toSQL().should.equal('mediumtext');

    cd = ColumnDefinitions.longtext();
    cd.$toSQL().should.equal('longtext');

    cd = ColumnDefinitions.binary();
    cd.$toSQL().should.equal('binary');

    cd = ColumnDefinitions.varbinary();
    cd.$toSQL().should.equal('varbinary');

    cd = ColumnDefinitions.blob();
    cd.$toSQL().should.equal('blob');

    cd = ColumnDefinitions.tinyblob();
    cd.$toSQL().should.equal('tinyblob');

    cd = ColumnDefinitions.mediumblob();
    cd.$toSQL().should.equal('mediumblob');

    cd = ColumnDefinitions.longblob();
    cd.$toSQL().should.equal('longblob');

    cd = ColumnDefinitions.enum('value');
    cd.$toSQL().should.equal("enum('value')");

    cd = ColumnDefinitions.set('value');
    cd.$toSQL().should.equal("set('value')");
  });


  it('should generate SQL with lengths for certain types', () => {
    var cd;

    cd = ColumnDefinitions.tinyint(1);
    cd.$toSQL().should.equal('tinyint(1)');

    cd = ColumnDefinitions.smallint(1);
    cd.$toSQL().should.equal('smallint(1)');

    cd = ColumnDefinitions.mediumint(1);
    cd.$toSQL().should.equal('mediumint(1)');

    cd = ColumnDefinitions.int(1);
    cd.$toSQL().should.equal('int(1)');

    cd = ColumnDefinitions.integer(1);
    cd.$toSQL().should.equal('integer(1)');

    cd = ColumnDefinitions.bigint(1);
    cd.$toSQL().should.equal('bigint(1)');

    cd = ColumnDefinitions.float(1);
    cd.$toSQL().should.equal('float(1)');

    cd = ColumnDefinitions.double(1);
    cd.$toSQL().should.equal('double(1)');

    cd = ColumnDefinitions.decimal(1);
    cd.$toSQL().should.equal('decimal(1)');

    cd = ColumnDefinitions.dec(1);
    cd.$toSQL().should.equal('dec(1)');

    cd = ColumnDefinitions.numeric(1);
    cd.$toSQL().should.equal('numeric(1)');

    cd = ColumnDefinitions.fixed(1);
    cd.$toSQL().should.equal('fixed(1)');

    cd = ColumnDefinitions.float(1, 2);
    cd.$toSQL().should.equal('float(1,2)');

    cd = ColumnDefinitions.double(1, 2);
    cd.$toSQL().should.equal('double(1,2)');

    cd = ColumnDefinitions.decimal(1, 2);
    cd.$toSQL().should.equal('decimal(1,2)');

    cd = ColumnDefinitions.dec(1, 2);
    cd.$toSQL().should.equal('dec(1,2)');

    cd = ColumnDefinitions.numeric(1, 2);
    cd.$toSQL().should.equal('numeric(1,2)');

    cd = ColumnDefinitions.fixed(1, 2);
    cd.$toSQL().should.equal('fixed(1,2)');

    cd = ColumnDefinitions.bit(1);
    cd.$toSQL().should.equal('bit(1)');

    cd = ColumnDefinitions.datetime(1);
    cd.$toSQL().should.equal('datetime(1)');

    cd = ColumnDefinitions.timestamp(1);
    cd.$toSQL().should.equal('timestamp(1)');

    cd = ColumnDefinitions.time(1);
    cd.$toSQL().should.equal('time(1)');

    cd = ColumnDefinitions.char(1);
    cd.$toSQL().should.equal('char(1)');

    cd = ColumnDefinitions.varchar(1);
    cd.$toSQL().should.equal('varchar(1)');

    cd = ColumnDefinitions.text(1);
    cd.$toSQL().should.equal('text(1)');

    cd = ColumnDefinitions.binary(1);
    cd.$toSQL().should.equal('binary(1)');

    cd = ColumnDefinitions.varbinary(1);
    cd.$toSQL().should.equal('varbinary(1)');

    cd = ColumnDefinitions.blob(1);
    cd.$toSQL().should.equal('blob(1)');
  });


  describe('all data types', () => {

    it('should be able to generate SQL with the DEFAULT or NOT NULL attributes', () => {
      var cd;

      cd = ColumnDefinitions.int().notNull().default(1);
      cd.$toSQL().should.equal('int NOT NULL DEFAULT 1');

      cd = ColumnDefinitions.char().notNull().default('1');
      cd.$toSQL().should.equal('char NOT NULL DEFAULT \'1\'');

      cd = ColumnDefinitions.blob().notNull().default('1');
      cd.$toSQL().should.equal('blob NOT NULL DEFAULT \'1\'');

      // Special case for TIMESTAMP and DATETIME types when the default is CURRENT_TIMESTAMP
      cd = ColumnDefinitions.timestamp().default('CURRENT_TIMESTAMP');
      cd.$toSQL().should.equal('timestamp DEFAULT CURRENT_TIMESTAMP');

      cd = ColumnDefinitions.datetime().default('CURRENT_TIMESTAMP');
      cd.$toSQL().should.equal('datetime DEFAULT CURRENT_TIMESTAMP');

      // Make sure TIMESTAMP and DATETIME still escape other values
      cd = ColumnDefinitions.timestamp().default('1970-01-01 00:00:01');
      cd.$toSQL().should.equal('timestamp DEFAULT \'1970-01-01 00:00:01\'');

      cd = ColumnDefinitions.datetime().default('1970-01-01 00:00:01');
      cd.$toSQL().should.equal('datetime DEFAULT \'1970-01-01 00:00:01\'');
    });

    it('should allow the columns to be defined as keys, but not change the SQL', () => {
      var cd;

      cd = ColumnDefinitions.int().notNull().default(1).index();
      cd.$toSQL().should.equal('int NOT NULL DEFAULT 1');

      cd = ColumnDefinitions.char().notNull().default('1').index();
      cd.$toSQL().should.equal('char NOT NULL DEFAULT \'1\'');

      cd = ColumnDefinitions.blob().notNull().default('1').index();
      cd.$toSQL().should.equal('blob NOT NULL DEFAULT \'1\'');

      cd = ColumnDefinitions.int().unique();
      cd.$toSQL().should.equal('int');

      cd = ColumnDefinitions.char().unique();
      cd.$toSQL().should.equal('char');

      cd = ColumnDefinitions.blob().unique();
      cd.$toSQL().should.equal('blob');
    });

    it('should allow the columns to be defined as primary keys, but not change the SQL, except for forcing the column to be NOT NULL', () => {
      var cd;

      cd = ColumnDefinitions.int().notNull().default(1).primaryKey();
      cd.$toSQL().should.equal('int NOT NULL DEFAULT 1');

      cd = ColumnDefinitions.char().notNull().default('1').primaryKey();
      cd.$toSQL().should.equal('char NOT NULL DEFAULT \'1\'');

      cd = ColumnDefinitions.blob().notNull().default('1').primaryKey();
      cd.$toSQL().should.equal('blob NOT NULL DEFAULT \'1\'');

      cd = ColumnDefinitions.int().primaryKey();
      cd.$toSQL().should.equal('int NOT NULL');

      cd = ColumnDefinitions.char().primaryKey();
      cd.$toSQL().should.equal('char NOT NULL');

      cd = ColumnDefinitions.blob().primaryKey();
      cd.$toSQL().should.equal('blob NOT NULL');
    });

  });


  describe('number data types', () => {

    it('should provide number-specific definition methods', () => {
      var cd;

      cd = ColumnDefinitions.integer().unsigned();
      cd.$toSQL().should.equal('integer unsigned');

      cd = ColumnDefinitions.integer().unsigned().zerofill();
      cd.$toSQL().should.equal('integer unsigned zerofill');

      cd = ColumnDefinitions.integer().zerofill();
      cd.$toSQL().should.equal('integer unsigned zerofill');

      cd = ColumnDefinitions.integer().unsigned().autoIncrement();
      cd.$toSQL().should.equal('integer unsigned AUTO_INCREMENT');
    });

  });


  describe('string data types', () => {

    it('should provide string-specific definition methods', () => {
      var cd;

      cd = ColumnDefinitions.varchar().charset('utf8');
      cd.$toSQL().should.equal('varchar CHARACTER SET utf8');

      cd = ColumnDefinitions.varchar().collate('utf8_general_ci');
      cd.$toSQL().should.equal('varchar COLLATE utf8_general_ci');

      cd = ColumnDefinitions.varchar().charset('utf8').collate('utf8_general_ci');
      cd.$toSQL().should.equal('varchar CHARACTER SET utf8 COLLATE utf8_general_ci');
    });

  });


  describe('updatable time data types', () => {

    it('should provide the onUpdateCurrentTimestamp() method', () => {
      var cd;

      cd = ColumnDefinitions.datetime().onUpdateCurrentTimestamp();
      cd.$toSQL().should.equal('datetime ON UPDATE CURRENT_TIMESTAMP');

      cd = ColumnDefinitions.timestamp().onUpdateCurrentTimestamp();
      cd.$toSQL().should.equal('timestamp ON UPDATE CURRENT_TIMESTAMP');
    });

  });


  describe('enums and sets', () => {

    it('should generate SQL with allowed values for certain types', () => {
      var cd;

      cd = ColumnDefinitions.enum('a');
      cd.$toSQL().should.equal("enum('a')");

      cd = ColumnDefinitions.enum('a', 'b', 'c');
      cd.$toSQL().should.equal("enum('a', 'b', 'c')");

      cd = ColumnDefinitions.set('a');
      cd.$toSQL().should.equal("set('a')");

      cd = ColumnDefinitions.set('a', 'b', 'c');
      cd.$toSQL().should.equal("set('a', 'b', 'c')");
    });

    it('should throw if no values are provided when creating the column definition', () => {
      should.throws(() => ColumnDefinitions.enum(), /provide at least one possible enum value/);
      should.throws(() => ColumnDefinitions.set(), /provide at least one possible set value/);
    });

  });

});
