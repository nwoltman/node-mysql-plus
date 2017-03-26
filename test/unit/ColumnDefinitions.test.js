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

    a = ColumnDefinitions.smallint().default(1);
    b = ColumnDefinitions.smallint().default(1);
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.bool().default(true);
    b = ColumnDefinitions.bool().default(true);
    a.$equals(b).should.be.true();

    a = ColumnDefinitions.blob().notNull();
    b = ColumnDefinitions.blob().notNull().default('a');
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.blob().notNull().default('a');
    b = ColumnDefinitions.blob().notNull().default('b');
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.smallint().notNull().default(1);
    b = ColumnDefinitions.smallint().notNull().default(2);
    a.$equals(b).should.be.false();

    a = ColumnDefinitions.bool().notNull().default(true);
    b = ColumnDefinitions.bool().notNull().default(false);
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

    a = ColumnDefinitions.char().charset('utf8').collate('utf8_bin').notNull().default('a');
    b = ColumnDefinitions.char().charset('utf8').collate('utf8_bin').notNull().default('a');
    a.$equals(b, {}).should.be.true();

    a = ColumnDefinitions.char().charset('utf8');
    b = ColumnDefinitions.char().charset('utf8').collate('utf8_bin');
    a.$equals(b, {}).should.be.false();

    a = ColumnDefinitions.char().charset('utf8');
    b = ColumnDefinitions.char().charset('ascii');
    a.$equals(b, {}).should.be.false();

    a = ColumnDefinitions.char().charset('utf8');
    b = ColumnDefinitions.char();
    a.$equals(b, {charset: 'utf8'}).should.be.true();

    a = ColumnDefinitions.char();
    b = ColumnDefinitions.char().collate('utf8mb4_unicode_520_ci');
    a.$equals(b, {collate: 'utf8mb4_unicode_520_ci'}).should.be.true();

    a = ColumnDefinitions.char().charset('utf8');
    b = ColumnDefinitions.char().collate('utf8_bin');
    a.$equals(b, {charset: 'utf8'}).should.be.false();

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

    // Setting an old name doesn't affect equality
    a = ColumnDefinitions.int().oldName('old_a');
    b = ColumnDefinitions.int().oldName('old_b');
    a.$equals(b).should.be.true();
    b.$equals(a).should.be.true();
  });


  it('should provide functions to define all possible MySQL data types', () => {
    ColumnDefinitions.tinyint()
      .$toSQL().should.equal('tinyint');

    ColumnDefinitions.smallint()
      .$toSQL().should.equal('smallint');

    ColumnDefinitions.mediumint()
      .$toSQL().should.equal('mediumint');

    ColumnDefinitions.int()
      .$toSQL().should.equal('int');

    ColumnDefinitions.integer()
      .$toSQL().should.equal('integer');

    ColumnDefinitions.bigint()
      .$toSQL().should.equal('bigint');

    ColumnDefinitions.float()
      .$toSQL().should.equal('float');

    ColumnDefinitions.double()
      .$toSQL().should.equal('double');

    ColumnDefinitions.decimal()
      .$toSQL().should.equal('decimal');

    ColumnDefinitions.dec()
      .$toSQL().should.equal('dec');

    ColumnDefinitions.numeric()
      .$toSQL().should.equal('numeric');

    ColumnDefinitions.fixed()
      .$toSQL().should.equal('fixed');

    ColumnDefinitions.bit()
      .$toSQL().should.equal('bit');

    ColumnDefinitions.bool()
      .$toSQL().should.equal('bool');

    ColumnDefinitions.boolean()
      .$toSQL().should.equal('boolean');

    ColumnDefinitions.date()
      .$toSQL().should.equal('date');

    ColumnDefinitions.datetime()
      .$toSQL().should.equal('datetime');

    ColumnDefinitions.timestamp()
      .$toSQL().should.equal('timestamp NULL'); // timestamp columns are special

    ColumnDefinitions.time()
      .$toSQL().should.equal('time');

    ColumnDefinitions.year()
      .$toSQL().should.equal('year');

    ColumnDefinitions.char()
      .$toSQL().should.equal('char');

    ColumnDefinitions.varchar(1)
      .$toSQL().should.equal('varchar(1)');

    ColumnDefinitions.text()
      .$toSQL().should.equal('text');

    ColumnDefinitions.tinytext()
      .$toSQL().should.equal('tinytext');

    ColumnDefinitions.mediumtext()
      .$toSQL().should.equal('mediumtext');

    ColumnDefinitions.longtext()
      .$toSQL().should.equal('longtext');

    ColumnDefinitions.binary()
      .$toSQL().should.equal('binary');

    ColumnDefinitions.varbinary(1)
      .$toSQL().should.equal('varbinary(1)');

    ColumnDefinitions.blob()
      .$toSQL().should.equal('blob');

    ColumnDefinitions.tinyblob()
      .$toSQL().should.equal('tinyblob');

    ColumnDefinitions.mediumblob()
      .$toSQL().should.equal('mediumblob');

    ColumnDefinitions.longblob()
      .$toSQL().should.equal('longblob');

    ColumnDefinitions.enum('value')
      .$toSQL().should.equal("enum('value')");

    ColumnDefinitions.set('value')
      .$toSQL().should.equal("set('value')");

    ColumnDefinitions.json()
      .$toSQL().should.equal('json');

    ColumnDefinitions.geometry()
      .$toSQL().should.equal('geometry');

    ColumnDefinitions.point()
      .$toSQL().should.equal('point');

    ColumnDefinitions.linestring()
      .$toSQL().should.equal('linestring');

    ColumnDefinitions.polygon()
      .$toSQL().should.equal('polygon');

    ColumnDefinitions.multipoint()
      .$toSQL().should.equal('multipoint');

    ColumnDefinitions.multilinestring()
      .$toSQL().should.equal('multilinestring');

    ColumnDefinitions.multipolygon()
      .$toSQL().should.equal('multipolygon');

    ColumnDefinitions.geometrycollection()
      .$toSQL().should.equal('geometrycollection');
  });


  it('should generate SQL with lengths for certain types', () => {
    ColumnDefinitions.tinyint(1)
      .$toSQL().should.equal('tinyint(1)');

    ColumnDefinitions.smallint(1)
      .$toSQL().should.equal('smallint(1)');

    ColumnDefinitions.mediumint(1)
      .$toSQL().should.equal('mediumint(1)');

    ColumnDefinitions.int(1)
      .$toSQL().should.equal('int(1)');

    ColumnDefinitions.integer(1)
      .$toSQL().should.equal('integer(1)');

    ColumnDefinitions.bigint(1)
      .$toSQL().should.equal('bigint(1)');

    ColumnDefinitions.float(1)
      .$toSQL().should.equal('float(1)');

    ColumnDefinitions.double(1)
      .$toSQL().should.equal('double(1)');

    ColumnDefinitions.decimal(1)
      .$toSQL().should.equal('decimal(1)');

    ColumnDefinitions.dec(1)
      .$toSQL().should.equal('dec(1)');

    ColumnDefinitions.numeric(1)
      .$toSQL().should.equal('numeric(1)');

    ColumnDefinitions.fixed(1)
      .$toSQL().should.equal('fixed(1)');

    ColumnDefinitions.float(1, 2)
      .$toSQL().should.equal('float(1,2)');

    ColumnDefinitions.double(1, 2)
      .$toSQL().should.equal('double(1,2)');

    ColumnDefinitions.decimal(1, 2)
      .$toSQL().should.equal('decimal(1,2)');

    ColumnDefinitions.dec(1, 2)
      .$toSQL().should.equal('dec(1,2)');

    ColumnDefinitions.numeric(1, 2)
      .$toSQL().should.equal('numeric(1,2)');

    ColumnDefinitions.fixed(1, 2)
      .$toSQL().should.equal('fixed(1,2)');

    ColumnDefinitions.bit(1)
      .$toSQL().should.equal('bit(1)');

    ColumnDefinitions.datetime(1)
      .$toSQL().should.equal('datetime(1)');

    ColumnDefinitions.timestamp(1)
      .$toSQL().should.equal('timestamp(1) NULL'); // timestamp columns are special

    ColumnDefinitions.time(1)
      .$toSQL().should.equal('time(1)');

    ColumnDefinitions.char(1)
      .$toSQL().should.equal('char(1)');

    ColumnDefinitions.varchar(1)
      .$toSQL().should.equal('varchar(1)');

    ColumnDefinitions.text(1)
      .$toSQL().should.equal('text(1)');

    ColumnDefinitions.binary(1)
      .$toSQL().should.equal('binary(1)');

    ColumnDefinitions.varbinary(1)
      .$toSQL().should.equal('varbinary(1)');

    ColumnDefinitions.blob(1)
      .$toSQL().should.equal('blob(1)');
  });


  describe('all data types', () => {

    it('should be able to generate SQL with the DEFAULT or NOT NULL attributes', () => {
      ColumnDefinitions.bool().notNull().default(true)
        .$toSQL().should.equal('bool NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.bool().notNull().default(false)
        .$toSQL().should.equal('bool NOT NULL DEFAULT \'0\'');

      ColumnDefinitions.int().notNull().default(1)
        .$toSQL().should.equal('int NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.char().notNull().default('1')
        .$toSQL().should.equal('char NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.blob().notNull().default('1')
        .$toSQL().should.equal('blob NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.timestamp().default('CURRENT_TIMESTAMP')
        .$toSQL().should.equal('timestamp NULL DEFAULT \'CURRENT_TIMESTAMP\'');

      ColumnDefinitions.datetime().default('1970-01-01 00:00:01')
        .$toSQL().should.equal('datetime DEFAULT \'1970-01-01 00:00:01\'');
    });

    it('should allow the columns to be defined as keys, but not change the SQL', () => {
      ColumnDefinitions.int().notNull().default(1).index()
        .$toSQL().should.equal('int NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.char().notNull().default('1').index()
        .$toSQL().should.equal('char NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.blob().notNull().default('1').index()
        .$toSQL().should.equal('blob NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.int().unique()
        .$toSQL().should.equal('int');

      ColumnDefinitions.char().unique()
        .$toSQL().should.equal('char');

      ColumnDefinitions.blob().unique()
        .$toSQL().should.equal('blob');

      ColumnDefinitions.geometry().spatialIndex()
        .$toSQL().should.equal('geometry');

      ColumnDefinitions.point().notNull().index().spatialIndex()
        .$toSQL().should.equal('point NOT NULL');
    });

    it('should allow the columns to be defined as primary keys, but not change the SQL, except for forcing the column to be NOT NULL', () => {
      ColumnDefinitions.int().notNull().default(1).primaryKey()
        .$toSQL().should.equal('int NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.char().notNull().default('1').primaryKey()
        .$toSQL().should.equal('char NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.blob().notNull().default('1').primaryKey()
        .$toSQL().should.equal('blob NOT NULL DEFAULT \'1\'');

      ColumnDefinitions.int().primaryKey()
        .$toSQL().should.equal('int NOT NULL');

      ColumnDefinitions.char().primaryKey()
        .$toSQL().should.equal('char NOT NULL');

      ColumnDefinitions.blob().primaryKey()
        .$toSQL().should.equal('blob NOT NULL');
    });

    it('should allow columns to have their old column name specified but not change the SQL', () => {
      ColumnDefinitions.int().oldName('old').$toSQL()
        .should.equal(ColumnDefinitions.int().$toSQL());

      ColumnDefinitions.char().oldName('old').$toSQL()
        .should.equal(ColumnDefinitions.char().$toSQL());

      ColumnDefinitions.blob().oldName('old').$toSQL()
        .should.equal(ColumnDefinitions.blob().$toSQL());

      ColumnDefinitions.timestamp().oldName('old').$toSQL()
        .should.equal(ColumnDefinitions.timestamp().$toSQL());
    });

  });


  describe('number data types', () => {

    it('should provide number-specific definition methods', () => {
      ColumnDefinitions.integer().unsigned()
        .$toSQL().should.equal('integer unsigned');

      ColumnDefinitions.integer().unsigned().zerofill()
        .$toSQL().should.equal('integer unsigned zerofill');

      ColumnDefinitions.integer().zerofill()
        .$toSQL().should.equal('integer unsigned zerofill');

      ColumnDefinitions.integer().unsigned().autoIncrement()
        .$toSQL().should.equal('integer unsigned AUTO_INCREMENT');
    });

  });


  describe('string data types', () => {

    it('should provide string-specific definition methods', () => {
      ColumnDefinitions.char().charset('utf8')
        .$toSQL().should.equal('char CHARACTER SET utf8');

      ColumnDefinitions.char().collate('utf8_general_ci')
        .$toSQL().should.equal('char COLLATE utf8_general_ci');

      ColumnDefinitions.char().charset('utf8').collate('utf8_general_ci')
        .$toSQL().should.equal('char CHARACTER SET utf8 COLLATE utf8_general_ci');
    });

  });


  describe('updatable time data types', () => {

    it('should provide the defaultCurrentTimestamp() method', () => {
      ColumnDefinitions.datetime().defaultCurrentTimestamp()
        .$toSQL().should.equal('datetime DEFAULT CURRENT_TIMESTAMP');

      ColumnDefinitions.timestamp().defaultCurrentTimestamp()
        .$toSQL().should.equal('timestamp NULL DEFAULT CURRENT_TIMESTAMP');
    });

    it('should provide the onUpdateCurrentTimestamp() method', () => {
      ColumnDefinitions.datetime().onUpdateCurrentTimestamp()
        .$toSQL().should.equal('datetime ON UPDATE CURRENT_TIMESTAMP');

      ColumnDefinitions.timestamp().onUpdateCurrentTimestamp()
        .$toSQL().should.equal('timestamp NULL ON UPDATE CURRENT_TIMESTAMP');
    });

  });


  describe('timestamp', () => {

    it('should allow NULL by default', () => {
      ColumnDefinitions.timestamp()
        .$toSQL().should.equal('timestamp NULL');
    });

    it('should default to CURRENT_TIMESTAMP if required to be NOT NULL', () => {
      ColumnDefinitions.timestamp().notNull()
        .$toSQL().should.equal('timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP');
    });

    it('should convert DEFAULT 0 to the equivalent timestamp string', () => {
      ColumnDefinitions.timestamp().default(0)
        .$toSQL().should.equal("timestamp NULL DEFAULT '0000-00-00 00:00:00'");
    });

  });


  describe('varchar and varbinary', () => {

    it('should throw if no `m` value is provided when creating the column definition', () => {
      should.throws(() => ColumnDefinitions.varchar(), /You must specify the `m` argument for varchar/);
      should.throws(() => ColumnDefinitions.varbinary(), /You must specify the `m` argument for varbinary/);
    });

    it('should accept 0 as a valid `m` value', () => {
      ColumnDefinitions.varchar(0).$toSQL().should.equal('varchar(0)');
      ColumnDefinitions.varbinary(0).$toSQL().should.equal('varbinary(0)');
    });

  });


  describe('enums and sets', () => {

    it('should generate SQL with allowed values for certain types', () => {
      ColumnDefinitions.enum('a')
        .$toSQL().should.equal("enum('a')");

      ColumnDefinitions.enum('a', 'b', 'c')
        .$toSQL().should.equal("enum('a', 'b', 'c')");

      ColumnDefinitions.set('a')
        .$toSQL().should.equal("set('a')");

      ColumnDefinitions.set('a', 'b', 'c')
        .$toSQL().should.equal("set('a', 'b', 'c')");
    });

    it('should throw if no values are provided when creating the column definition', () => {
      should.throws(() => ColumnDefinitions.enum(), /provide at least one possible enum value/);
      should.throws(() => ColumnDefinitions.set(), /provide at least one possible set value/);
    });

  });


  describe('geometrical data types', () => {

    it('should be able to create spatial indexes', () => {
      ColumnDefinitions.geometry().spatialIndex()
        .$toSQL().should.equal('geometry');

      ColumnDefinitions.point().spatialIndex()
        .$toSQL().should.equal('point');

      ColumnDefinitions.linestring().spatialIndex()
        .$toSQL().should.equal('linestring');

      ColumnDefinitions.polygon().spatialIndex()
        .$toSQL().should.equal('polygon');

      ColumnDefinitions.multipoint().spatialIndex()
        .$toSQL().should.equal('multipoint');

      ColumnDefinitions.multilinestring().spatialIndex()
        .$toSQL().should.equal('multilinestring');

      ColumnDefinitions.multipolygon().spatialIndex()
        .$toSQL().should.equal('multipolygon');

      ColumnDefinitions.geometrycollection().spatialIndex()
        .$toSQL().should.equal('geometrycollection');
    });

  });

});
