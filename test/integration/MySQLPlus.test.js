'use strict';

const CallbackManager = require('es6-callback-manager');
const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');
const sinon = require('sinon');

const ColTypes = MySQLPlus.ColTypes;

describe('MySQLPlus', function() {

  this.timeout(10000);

  const bigTableName = 'big_table';
  const bigTableSchema = {
    columns: {
      id: ColTypes.bigint().unsigned().notNull().primaryKey().autoIncrement(),
      name: ColTypes.varchar(63),
      email: ColTypes.varchar(255).notNull().unique(),
      password: ColTypes.char(40).notNull(),
      letter: ColTypes.char(1).default('a').index(),
      created: ColTypes.datetime().defaultCurrentTimestamp(),
      updated: ColTypes.datetime().onUpdateCurrentTimestamp(),
      weirdtext: ColTypes.tinytext().charset('ascii').collate('ascii_bin'),
      zfill: ColTypes.smallint().zerofill(),
      myenum: ColTypes.enum('A', 'B', 'C').default('A'),
      myset: ColTypes.set('ONE', 'TWO'),
      jdoc: ColTypes.json(),
      location: ColTypes.point().notNull().spatialIndex(),
      line: ColTypes.linestring(),
    },
    uniqueKeys: [
      ['name', 'letter'],
      'created',
    ],
    engine: 'InnoDB',
  };
  const bigTableExpectedSQL =
    'CREATE TABLE `big_table` (\n' +
    '  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `name` varchar(63) DEFAULT NULL,\n' +
    '  `email` varchar(255) NOT NULL,\n' +
    '  `password` char(40) NOT NULL,\n' +
    '  `letter` char(1) DEFAULT \'a\',\n' +
    '  `created` datetime DEFAULT CURRENT_TIMESTAMP,\n' +
    '  `updated` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,\n' +
    '  `weirdtext` tinytext CHARACTER SET ascii COLLATE ascii_bin,\n' +
    '  `zfill` smallint(5) unsigned zerofill DEFAULT NULL,\n' +
    '  `myenum` enum(\'A\',\'B\',\'C\') DEFAULT \'A\',\n' +
    '  `myset` set(\'ONE\',\'TWO\') DEFAULT NULL,\n' +
    '  `jdoc` json DEFAULT NULL,\n' +
    '  `location` point NOT NULL,\n' +
    '  `line` linestring DEFAULT NULL,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `unique_big_table_email` (`email`),\n' +
    '  UNIQUE KEY `unique_big_table_name_letter` (`name`,`letter`),\n' +
    '  UNIQUE KEY `unique_big_table_created` (`created`),\n' +
    '  KEY `index_big_table_letter` (`letter`),\n' +
    '  SPATIAL KEY `spatial_big_table_location` (`location`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const autoIncTableName = 'auto_inc_table';
  const autoIncTableSchema = {
    columns: {
      id: ColTypes.bigint().unsigned().primaryKey().autoIncrement(),
      number: ColTypes.mediumint(),
    },
    indexes: ['number'],
    autoIncrement: 5000000000,
  };
  const autoIncTableExpectedSQL =
    'CREATE TABLE `auto_inc_table` (\n' +
    '  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `number` mediumint(9) DEFAULT NULL,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  KEY `index_auto_inc_table_number` (`number`)\n' +
    ') ENGINE=InnoDB AUTO_INCREMENT=5000000000 DEFAULT CHARSET=utf8';

  const autoIncTableMigratedSchema = {
    columns: {
      id: ColTypes.bigint().unsigned().primaryKey().autoIncrement(),
      number: ColTypes.mediumint(),
    },
    indexes: ['number'],
    autoIncrement: 6000000000,
  };
  const autoIncTableMigratedExpectedSQL =
    'CREATE TABLE `auto_inc_table` (\n' +
    '  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `number` mediumint(9) DEFAULT NULL,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  KEY `index_auto_inc_table_number` (`number`)\n' +
    ') ENGINE=InnoDB AUTO_INCREMENT=6000000000 DEFAULT CHARSET=utf8';

  const pivotTableName = 'pivot_table';
  const pivotTableSchema = {
    columns: {
      autoID: ColTypes.bigint().unsigned(),
      autoNumber: ColTypes.mediumint(),
      bigID: ColTypes.bigint().unsigned().index(),
    },
    primaryKey: ['autoID', 'autoNumber'],
    indexes: ['autoNumber'],
    foreignKeys: {
      autoID: 'auto_inc_table.id',
      autoNumber: {
        table: 'auto_inc_table',
        column: 'number',
      },
      bigID: {
        table: 'big_table',
        column: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'SET NULL',
      },
    },
  };
  const pivotTableExpectedSQL =
    'CREATE TABLE `pivot_table` (\n' +
    '  `autoID` bigint(20) unsigned NOT NULL,\n' +
    '  `autoNumber` mediumint(9) NOT NULL,\n' +
    '  `bigID` bigint(20) unsigned DEFAULT NULL,\n' +
    '  PRIMARY KEY (`autoID`,`autoNumber`),\n' +
    '  KEY `index_pivot_table_autoNumber` (`autoNumber`),\n' +
    '  KEY `index_pivot_table_bigID` (`bigID`),\n' +
    '  CONSTRAINT `fk_pivot_table_autoID` FOREIGN KEY (`autoID`) REFERENCES `auto_inc_table` (`id`),\n' +
    '  CONSTRAINT `fk_pivot_table_autoNumber` FOREIGN KEY (`autoNumber`) REFERENCES `auto_inc_table` (`number`),\n' +
    '  CONSTRAINT `fk_pivot_table_bigID` FOREIGN KEY (`bigID`) REFERENCES `big_table` (`id`) ON DELETE CASCADE ON UPDATE SET NULL\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const columnsTableName = 'columns_table';
  const columnsTableSchema = {
    columns: {
      id: ColTypes.int().unsigned().notNull().primaryKey(),
      uuid: ColTypes.char(44).unique(),
      email: ColTypes.char(255),
      fp: ColTypes.float(7, 4),
      dropme: ColTypes.blob(),
      renameme: ColTypes.tinyint(),
      changeme: ColTypes.tinyint(),
      neverchange: ColTypes.tinyint().oldName('fake_column'),
      norename: ColTypes.tinyint().oldName('fake_column'),
    },
    indexes: ['email', ['id', 'email']],
  };
  const columnsTableExpectedSQL =
    'CREATE TABLE `columns_table` (\n' +
    '  `id` int(10) unsigned NOT NULL,\n' +
    '  `uuid` char(44) DEFAULT NULL,\n' +
    '  `email` char(255) DEFAULT NULL,\n' +
    '  `fp` float(7,4) DEFAULT NULL,\n' +
    '  `dropme` blob,\n' +
    '  `renameme` tinyint(4) DEFAULT NULL,\n' +
    '  `changeme` tinyint(4) DEFAULT NULL,\n' +
    '  `neverchange` tinyint(4) DEFAULT NULL,\n' +
    '  `norename` tinyint(4) DEFAULT NULL,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `unique_columns_table_uuid` (`uuid`),\n' +
    '  KEY `index_columns_table_email` (`email`),\n' +
    '  KEY `index_columns_table_id_email` (`id`,`email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const columnsTableMigratedSchema = {
    columns: {
      id: ColTypes.bigint(5).unsigned().notNull().primaryKey(),
      uuid: ColTypes.char(44).unique(),
      email: ColTypes.varchar(255).notNull(),
      fp: ColTypes.float(8, 3),
      renamed: ColTypes.tinyint().oldName('renameme'),
      changed: ColTypes.smallint().oldName('changeme'),
      neverchange: ColTypes.tinyint().oldName('fake_column'),
      norename: ColTypes.smallint().oldName('fake_column'),
      added: ColTypes.text(),
    },
    indexes: [['id', 'email']],
    uniqueKeys: ['email'],
  };
  const columnsTableMigratedExpectedSQL =
    'CREATE TABLE `columns_table` (\n' +
    '  `id` bigint(5) unsigned NOT NULL,\n' +
    '  `uuid` char(44) DEFAULT NULL,\n' +
    '  `email` varchar(255) NOT NULL,\n' +
    '  `fp` float(8,3) DEFAULT NULL,\n' +
    '  `renamed` tinyint(4) DEFAULT NULL,\n' +
    '  `changed` smallint(6) DEFAULT NULL,\n' +
    '  `neverchange` tinyint(4) DEFAULT NULL,\n' +
    '  `norename` smallint(6) DEFAULT NULL,\n' +
    '  `added` text,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `unique_columns_table_email` (`email`),\n' +
    '  UNIQUE KEY `unique_columns_table_uuid` (`uuid`),\n' +
    '  KEY `index_columns_table_id_email` (`id`,`email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const primaryKeyTableName = 'pk_table';
  const primaryKeyTableSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.char(1),
    },
    primaryKey: ['a', 'b'],
  };
  const primaryKeyTableExpectedSQL =
    'CREATE TABLE `pk_table` (\n' +
    '  `a` int(11) NOT NULL,\n' +
    '  `b` char(1) NOT NULL,\n' +
    '  PRIMARY KEY (`a`,`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const primaryKeyTableMigratedSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.char(1),
    },
    primaryKey: 'a',
  };
  const primaryKeyTableMigratedExpectedSQL =
    'CREATE TABLE `pk_table` (\n' +
    '  `a` int(11) NOT NULL,\n' +
    '  `b` char(1) DEFAULT NULL,\n' +
    '  PRIMARY KEY (`a`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const uniqueKeysTableName = 'unique_table';
  const uniqueKeysTableSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.bigint(),
      c: ColTypes.char(1),
    },
    uniqueKeys: [
      ['a', 'b'],
      'c',
    ],
  };
  const uniqueKeysTableExpectedSQL =
    'CREATE TABLE `unique_table` (\n' +
    '  `a` int(11) DEFAULT NULL,\n' +
    '  `b` bigint(20) DEFAULT NULL,\n' +
    '  `c` char(1) DEFAULT NULL,\n' +
    '  UNIQUE KEY `unique_unique_table_a_b` (`a`,`b`),\n' +
    '  UNIQUE KEY `unique_unique_table_c` (`c`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const uniqueKeysTableMigragedSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.bigint(),
      c: ColTypes.char(1),
    },
    uniqueKeys: [
      ['a', 'c'],
      'b',
    ],
  };
  const uniqueKeysTableMigratedExpectedSQL =
    'CREATE TABLE `unique_table` (\n' +
    '  `a` int(11) DEFAULT NULL,\n' +
    '  `b` bigint(20) DEFAULT NULL,\n' +
    '  `c` char(1) DEFAULT NULL,\n' +
    '  UNIQUE KEY `unique_unique_table_a_c` (`a`,`c`),\n' +
    '  UNIQUE KEY `unique_unique_table_b` (`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const indexesTableName = 'indexes_table';
  const indexesTableSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.bigint(),
      c: ColTypes.char(1),
    },
    indexes: [
      ['a', 'b'],
      'c',
    ],
  };
  const indexesTableExpectedSQL =
    'CREATE TABLE `indexes_table` (\n' +
    '  `a` int(11) DEFAULT NULL,\n' +
    '  `b` bigint(20) DEFAULT NULL,\n' +
    '  `c` char(1) DEFAULT NULL,\n' +
    '  KEY `index_indexes_table_a_b` (`a`,`b`),\n' +
    '  KEY `index_indexes_table_c` (`c`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const indexesTableMigragedSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.bigint(),
      c: ColTypes.char(1),
    },
    indexes: [
      ['a', 'c'],
      'b',
    ],
  };
  const indexesTableMigratedExpectedSQL =
    'CREATE TABLE `indexes_table` (\n' +
    '  `a` int(11) DEFAULT NULL,\n' +
    '  `b` bigint(20) DEFAULT NULL,\n' +
    '  `c` char(1) DEFAULT NULL,\n' +
    '  KEY `index_indexes_table_a_c` (`a`,`c`),\n' +
    '  KEY `index_indexes_table_b` (`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const spatialIndexesTableName = 'spatial_table';
  const spatialIndexesTableSchema = {
    columns: {
      a: ColTypes.geometry().notNull(),
      b: ColTypes.point().notNull(),
      c: ColTypes.multipolygon().notNull(),
    },
    spatialIndexes: [
      'a',
      'b',
    ],
  };
  const spatialIndexesTableExpectedSQL =
    'CREATE TABLE `spatial_table` (\n' +
    '  `a` geometry NOT NULL,\n' +
    '  `b` point NOT NULL,\n' +
    '  `c` multipolygon NOT NULL,\n' +
    '  SPATIAL KEY `spatial_spatial_table_a` (`a`),\n' +
    '  SPATIAL KEY `spatial_spatial_table_b` (`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const spatialIndexesTableMigragedSchema = {
    columns: {
      a: ColTypes.geometry().notNull(),
      b: ColTypes.point().notNull(),
      c: ColTypes.multipolygon().notNull(),
    },
    spatialIndexes: [
      'a',
      'c',
    ],
  };
  const spatialIndexesTableMigratedExpectedSQL =
    'CREATE TABLE `spatial_table` (\n' +
    '  `a` geometry NOT NULL,\n' +
    '  `b` point NOT NULL,\n' +
    '  `c` multipolygon NOT NULL,\n' +
    '  SPATIAL KEY `spatial_spatial_table_a` (`a`),\n' +
    '  SPATIAL KEY `spatial_spatial_table_c` (`c`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const foreignKeysTableName = 'fk_table';
  const foreignKeysTableSchema = {
    columns: {
      a: ColTypes.bigint().unsigned(),
      b: ColTypes.bigint().unsigned(),
      c: ColTypes.bigint().unsigned(),
      d: ColTypes.int().unsigned().notNull(),
      ai: ColTypes.int(),
      bi: ColTypes.bigint(),
      eb: ColTypes.varchar(63),
      fb: ColTypes.char(1).default('a'),
      gc: ColTypes.int().unsigned().notNull(),
      hc: ColTypes.char(255),
    },
    indexes: ['b', 'c', 'd', ['ai', 'bi'], ['eb', 'fb'], ['gc', 'hc']],
    foreignKeys: {
      'ai, bi': {
        table: 'indexes_table',
        column: ['a', 'b'],
      },
      b: 'big_table.id',
      c: {
        table: 'big_table',
        column: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION',
      },
      d: 'columns_table.id',
      'eb, fb': {
        table: 'big_table',
        column: ['name', 'letter'],
      },
      'gc, hc': {
        table: 'columns_table',
        column: ['id', 'email'],
      },
    },
  };
  const foreignKeysTableExpectedSQL =
    'CREATE TABLE `fk_table` (\n' +
    '  `a` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `b` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `c` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `d` int(10) unsigned NOT NULL,\n' +
    '  `ai` int(11) DEFAULT NULL,\n' +
    '  `bi` bigint(20) DEFAULT NULL,\n' +
    '  `eb` varchar(63) DEFAULT NULL,\n' +
    '  `fb` char(1) DEFAULT \'a\',\n' +
    '  `gc` int(10) unsigned NOT NULL,\n' +
    '  `hc` char(255) DEFAULT NULL,\n' +
    '  KEY `index_fk_table_b` (`b`),\n' +
    '  KEY `index_fk_table_c` (`c`),\n' +
    '  KEY `index_fk_table_d` (`d`),\n' +
    '  KEY `index_fk_table_ai_bi` (`ai`,`bi`),\n' +
    '  KEY `index_fk_table_eb_fb` (`eb`,`fb`),\n' +
    '  KEY `index_fk_table_gc_hc` (`gc`,`hc`),\n' +
    '  CONSTRAINT `fk_fk_table_ai_bi` FOREIGN KEY (`ai`, `bi`) REFERENCES `indexes_table` (`a`, `b`),\n' +
    '  CONSTRAINT `fk_fk_table_b` FOREIGN KEY (`b`) REFERENCES `big_table` (`id`),\n' +
    '  CONSTRAINT `fk_fk_table_c` FOREIGN KEY (`c`) REFERENCES `big_table` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,\n' +
    '  CONSTRAINT `fk_fk_table_d` FOREIGN KEY (`d`) REFERENCES `columns_table` (`id`),\n' +
    '  CONSTRAINT `fk_fk_table_eb_fb` FOREIGN KEY (`eb`, `fb`) REFERENCES `big_table` (`name`, `letter`),\n' +
    '  CONSTRAINT `fk_fk_table_gc_hc` FOREIGN KEY (`gc`, `hc`) REFERENCES `columns_table` (`id`, `email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const foreignKeysTableMigratedSchema = {
    columns: {
      a: ColTypes.bigint().unsigned(),
      b: ColTypes.bigint().unsigned(),
      c: ColTypes.bigint().unsigned(),
      d: ColTypes.bigint(5).unsigned().notNull(),
      ai: ColTypes.int(),
      ci: ColTypes.char(1),
      eb: ColTypes.varchar(63),
      fb: ColTypes.char(1).default('a'),
      gc: ColTypes.bigint(5).unsigned().notNull(),
      hc: ColTypes.varchar(255).notNull(),
    },
    indexes: ['a', 'c', 'd', ['ai', 'ci'], ['gc', 'hc']],
    uniqueKeys: [['eb', 'fb']],
    foreignKeys: {
      a: 'big_table.id',
      'ai, ci': {
        table: 'indexes_table',
        column: ['a', 'c'],
      },
      c: {
        table: 'big_table',
        column: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      d: 'columns_table.id',
      'eb, fb': {
        table: 'big_table',
        column: ['name', 'letter'],
      },
      'gc, hc': {
        table: 'columns_table',
        column: ['id', 'email'],
      },
    },
  };
  const foreignKeysTableMigratedExpectedSQL =
    'CREATE TABLE `fk_table` (\n' +
    '  `a` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `b` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `c` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `d` bigint(5) unsigned NOT NULL,\n' +
    '  `ai` int(11) DEFAULT NULL,\n' +
    '  `eb` varchar(63) DEFAULT NULL,\n' +
    '  `fb` char(1) DEFAULT \'a\',\n' +
    '  `gc` bigint(5) unsigned NOT NULL,\n' +
    '  `hc` varchar(255) NOT NULL,\n' +
    '  `ci` char(1) DEFAULT NULL,\n' +
    '  UNIQUE KEY `unique_fk_table_eb_fb` (`eb`,`fb`),\n' +
    '  KEY `index_fk_table_c` (`c`),\n' +
    '  KEY `index_fk_table_d` (`d`),\n' +
    '  KEY `index_fk_table_gc_hc` (`gc`,`hc`),\n' +
    '  KEY `index_fk_table_a` (`a`),\n' +
    '  KEY `index_fk_table_ai_ci` (`ai`,`ci`),\n' +
    '  CONSTRAINT `fk_fk_table_a` FOREIGN KEY (`a`) REFERENCES `big_table` (`id`),\n' +
    '  CONSTRAINT `fk_fk_table_ai_ci` FOREIGN KEY (`ai`, `ci`) REFERENCES `indexes_table` (`a`, `c`),\n' +
    '  CONSTRAINT `fk_fk_table_c` FOREIGN KEY (`c`) REFERENCES `big_table` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,\n' +
    '  CONSTRAINT `fk_fk_table_d` FOREIGN KEY (`d`) REFERENCES `columns_table` (`id`),\n' +
    '  CONSTRAINT `fk_fk_table_eb_fb` FOREIGN KEY (`eb`, `fb`) REFERENCES `big_table` (`name`, `letter`),\n' +
    '  CONSTRAINT `fk_fk_table_gc_hc` FOREIGN KEY (`gc`, `hc`) REFERENCES `columns_table` (`id`, `email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const optionsTableName = 'options_table';
  const optionsTableSchema = {
    columns: {
      id: ColTypes.int(),
    },
    engine: 'MyISAM',
    autoIncrement: 10,
    charset: 'ascii',
    collate: 'ascii_bin',
    compression: 'zlib',
    rowFormat: 'REDUNDANT',
  };
  const optionsTableExpectedSQL =
    'CREATE TABLE `options_table` (\n' +
    '  `id` int(11) DEFAULT NULL\n' +
    ') ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=ascii COLLATE=ascii_bin ROW_FORMAT=REDUNDANT COMPRESSION=\'zlib\'';

  const optionsTableMigratedSchema = {
    columns: {
      id: ColTypes.int(),
    },
    engine: 'InnoDB',
    charset: 'latin1',
    collate: 'latin1_bin',
    compression: 'LZ4',
    rowFormat: 'DEFAULT',
  };
  const optionsTableMigratedExpectedSQL =
    'CREATE TABLE `options_table` (\n' +
    '  `id` int(11) DEFAULT NULL\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_bin COMPRESSION=\'LZ4\'';

  const textTableName = 'text_table';
  const textTableSchema = {
    columns: {
      a: ColTypes.char(1),
      b: ColTypes.char(1).charset('utf8mb4'),
      c: ColTypes.char(1).charset('utf8mb4').collate('utf8mb4_unicode_520_ci'),
      d: ColTypes.char(1).collate('utf8mb4_unicode_520_ci'),
      e: ColTypes.char(1).collate('utf8mb4_bin'),
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_520_ci',
  };
  const textTableExpectedSQL =
    'CREATE TABLE `text_table` (\n' +
    '  `a` char(1) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,\n' +
    '  `b` char(1) CHARACTER SET utf8mb4 DEFAULT NULL,\n' +
    '  `c` char(1) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,\n' +
    '  `d` char(1) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,\n' +
    '  `e` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci';


  describe('when creating new tables', () => {

    const pool = MySQLPlus.createPool(config);

    before(done => {
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableSchema);
      pool.defineTable(indexesTableName, indexesTableSchema);
      pool.defineTable(spatialIndexesTableName, spatialIndexesTableSchema);
      pool.defineTable(foreignKeysTableName, foreignKeysTableSchema);
      pool.defineTable(optionsTableName, optionsTableSchema);
      pool.defineTable(textTableName, textTableSchema);
      pool.sync(done);
    });

    after(done => {
      pool.end(done);
    });

    it('should create the tables with the correct structure', done => {
      const cbManager = new CallbackManager(done);

      const cb1 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${bigTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(bigTableExpectedSQL);
        cb1();
      });

      const cb2 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${autoIncTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(autoIncTableExpectedSQL);
        cb2();
      });

      const cb3 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${pivotTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(pivotTableExpectedSQL);
        cb3();
      });

      const cb4 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${columnsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(columnsTableExpectedSQL);
        cb4();
      });

      const cb5 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${primaryKeyTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(primaryKeyTableExpectedSQL);
        cb5();
      });

      const cb6 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${uniqueKeysTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(uniqueKeysTableExpectedSQL);
        cb6();
      });

      const cb7 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${indexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(indexesTableExpectedSQL);
        cb7();
      });

      const cbSpatial = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${spatialIndexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(spatialIndexesTableExpectedSQL);
        cbSpatial();
      });

      const cb8 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${foreignKeysTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(foreignKeysTableExpectedSQL);
        cb8();
      });

      const cb9 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${optionsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(optionsTableExpectedSQL);
        cb9();
      });

      const cb10 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${textTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(textTableExpectedSQL);
        cb10();
      });
    });

  });


  describe('when re-defining existing tables without changing them and migrationStrategy = "alter"', () => {

    const pool = MySQLPlus.createPool(config);

    before(done => {
      sinon.spy(pool, '_runOperations');
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableSchema);
      pool.defineTable(indexesTableName, indexesTableSchema);
      pool.defineTable(spatialIndexesTableName, spatialIndexesTableSchema);
      pool.defineTable(foreignKeysTableName, foreignKeysTableSchema);
      pool.defineTable(optionsTableName, optionsTableSchema);
      pool.defineTable(textTableName, textTableSchema);
      pool.sync(done);
    });

    after(done => {
      pool._runOperations.restore();
      pool.end(done);
    });

    it('should not run any table-altering operations', () => {
      pool._runOperations.should.be.calledOnce().and.be.calledWith([]);
    });

    it('should not alter any of the tables\' structure', done => {
      const cbManager = new CallbackManager(done);

      const cb1 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${bigTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(bigTableExpectedSQL);
        cb1();
      });

      const cb2 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${autoIncTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(autoIncTableExpectedSQL);
        cb2();
      });

      const cb3 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${pivotTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(pivotTableExpectedSQL);
        cb3();
      });

      const cb4 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${columnsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(columnsTableExpectedSQL);
        cb4();
      });

      const cb5 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${primaryKeyTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(primaryKeyTableExpectedSQL);
        cb5();
      });

      const cb6 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${uniqueKeysTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(uniqueKeysTableExpectedSQL);
        cb6();
      });

      const cb7 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${indexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(indexesTableExpectedSQL);
        cb7();
      });

      const cbSpatial = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${spatialIndexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(spatialIndexesTableExpectedSQL);
        cbSpatial();
      });

      const cb8 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${foreignKeysTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(foreignKeysTableExpectedSQL);
        cb8();
      });

      const cb9 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${optionsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(optionsTableExpectedSQL);
        cb9();
      });

      const cb10 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${textTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(textTableExpectedSQL);
        cb10();
      });
    });

  });


  describe('when re-defining existing tables and migrationStrategy = "drop"', () => {

    const dropConfig = Object.assign({plusOptions: {migrationStrategy: 'drop'}}, config);
    const pool = MySQLPlus.createPool(dropConfig);

    before(done => {
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableSchema);
      pool.defineTable(indexesTableName, indexesTableSchema);
      pool.defineTable(spatialIndexesTableName, spatialIndexesTableSchema);
      pool.defineTable(foreignKeysTableName, foreignKeysTableSchema);
      pool.defineTable(optionsTableName, optionsTableSchema);
      pool.defineTable(textTableName, textTableSchema);
      pool.sync(done);
    });

    after(done => {
      pool.end(done);
    });

    it('should not alter any of the tables\' structure', done => {
      const cbManager = new CallbackManager(done);

      const cb1 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${bigTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(bigTableExpectedSQL);
        cb1();
      });

      const cb2 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${autoIncTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(autoIncTableExpectedSQL);
        cb2();
      });

      const cb3 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${pivotTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(pivotTableExpectedSQL);
        cb3();
      });

      const cb4 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${columnsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(columnsTableExpectedSQL);
        cb4();
      });

      const cb5 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${primaryKeyTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(primaryKeyTableExpectedSQL);
        cb5();
      });

      const cb6 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${uniqueKeysTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(uniqueKeysTableExpectedSQL);
        cb6();
      });

      const cb7 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${indexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(indexesTableExpectedSQL);
        cb7();
      });

      const cbSpatial = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${spatialIndexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(spatialIndexesTableExpectedSQL);
        cbSpatial();
      });

      const cb8 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${foreignKeysTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(foreignKeysTableExpectedSQL);
        cb8();
      });

      const cb9 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${optionsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(optionsTableExpectedSQL);
        cb9();
      });

      const cb10 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${textTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(textTableExpectedSQL);
        cb10();
      });
    });

  });


  describe('when migrating existing tables', () => {

    const pool = MySQLPlus.createPool(config);

    before(done => {
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableMigratedSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableMigratedSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableMigratedSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableMigragedSchema);
      pool.defineTable(indexesTableName, indexesTableMigragedSchema);
      pool.defineTable(spatialIndexesTableName, spatialIndexesTableMigragedSchema);
      pool.defineTable(foreignKeysTableName, foreignKeysTableMigratedSchema);
      pool.defineTable(optionsTableName, optionsTableMigratedSchema);

      // Insert data into the columns table before syncing the table changes so
      // we can check if the data is still there after some columns get renamed
      pool.query(
        `INSERT INTO ${columnsTableName} (id, email, renameme, changeme) VALUES (1, 'a', 1, 2), (2, 'b', 3, 4)`,
        err => {
          if (err) throw err;
          pool.sync(done);
        }
      );
    });

    after(done => {
      pool.end(done);
    });

    it('should migrate the tables to the correct new structure', done => {
      const cbManager = new CallbackManager(done);

      const cb1 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${bigTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(bigTableExpectedSQL);
        cb1();
      });

      const cb2 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${autoIncTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(autoIncTableMigratedExpectedSQL);
        cb2();
      });

      const cb3 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${pivotTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(pivotTableExpectedSQL);
        cb3();
      });

      const cb4 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${columnsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(columnsTableMigratedExpectedSQL);
        cb4();
      });

      const cb5 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${primaryKeyTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(primaryKeyTableMigratedExpectedSQL);
        cb5();
      });

      const cb6 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${uniqueKeysTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(uniqueKeysTableMigratedExpectedSQL);
        cb6();
      });

      const cb7 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${indexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(indexesTableMigratedExpectedSQL);
        cb7();
      });

      const cbSpatial = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${spatialIndexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(spatialIndexesTableMigratedExpectedSQL);
        cbSpatial();
      });

      const cb8 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${foreignKeysTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(foreignKeysTableMigratedExpectedSQL);
        cb8();
      });

      const cb9 = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${optionsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(optionsTableMigratedExpectedSQL);
        cb9();
      });
    });

    it('should not decrease the AUTO_INCREMENT table option', done => {
      const tempPool = MySQLPlus.createPool(config);
      // Try to go back to the original schema
      tempPool.defineTable(autoIncTableName, autoIncTableSchema);
      tempPool.sync(err => {
        if (err) throw err;

        tempPool.query(`SHOW CREATE TABLE \`${autoIncTableName}\``, (err, result) => {
          if (err) throw err;
          // The schema should not have changed from the migrated version
          result[0]['Create Table'].should.equal(autoIncTableMigratedExpectedSQL);
          tempPool.end(done);
        });
      });
    });

    it('should not lose data when renaming columns', done => {
      pool.query(`SELECT renamed, changed FROM ${columnsTableName}`, (err, rows) => {
        if (err) throw err;

        rows.should.have.length(2);

        rows[0].renamed.should.equal(1);
        rows[0].changed.should.equal(2);

        rows[1].renamed.should.equal(3);
        rows[1].changed.should.equal(4);

        done();
      });
    });

  });

});
