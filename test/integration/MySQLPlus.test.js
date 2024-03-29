'use strict';

const CallbackManager = require('es6-callback-manager');
const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');
const sinon = require('sinon');

const {ColTypes, KeyTypes} = MySQLPlus;

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
      description: ColTypes.text().fulltextIndex(),
    },
    keys: [
      KeyTypes.uniqueIndex('name', 'letter'),
      KeyTypes.uniqueIndex('created'),
    ],
    engine: 'InnoDB',
  };
  const bigTableExpectedSQL =
    'CREATE TABLE `big_table` (\n' +
    '  `id` bigint unsigned NOT NULL AUTO_INCREMENT,\n' +
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
    '  `description` text,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `uniq_email` (`email`),\n' +
    '  UNIQUE KEY `uniq_name_letter` (`name`,`letter`),\n' +
    '  UNIQUE KEY `uniq_created` (`created`),\n' +
    '  KEY `idx_letter` (`letter`),\n' +
    '  SPATIAL KEY `sptl_location` (`location`),\n' +
    '  FULLTEXT KEY `fltxt_description` (`description`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const autoIncTableName = 'auto_inc_table';
  const autoIncTableSchema = {
    columns: {
      id: ColTypes.bigint().unsigned().primaryKey().autoIncrement(),
      number: ColTypes.mediumint(),
    },
    keys: [
      KeyTypes.index('number'),
    ],
    autoIncrement: 5000000000,
  };
  const autoIncTableExpectedSQL =
    'CREATE TABLE `auto_inc_table` (\n' +
    '  `id` bigint unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `number` mediumint DEFAULT NULL,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  KEY `idx_number` (`number`)\n' +
    ') ENGINE=InnoDB AUTO_INCREMENT=5000000000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const autoIncTableMigratedSchema = {
    columns: {
      id: ColTypes.bigint().unsigned().primaryKey().autoIncrement(),
      number: ColTypes.mediumint(),
    },
    keys: [
      KeyTypes.index('number'),
    ],
    autoIncrement: 6000000000,
  };
  const autoIncTableMigratedExpectedSQL =
    'CREATE TABLE `auto_inc_table` (\n' +
    '  `id` bigint unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `number` mediumint DEFAULT NULL,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  KEY `idx_number` (`number`)\n' +
    ') ENGINE=InnoDB AUTO_INCREMENT=6000000000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const pivotTableName = 'pivot_table';
  const pivotTableSchema = {
    columns: {
      autoID: ColTypes.bigint().unsigned(),
      autoNumber: ColTypes.mediumint(),
      bigID: ColTypes.bigint().unsigned().index(),
    },
    primaryKey: ['autoID', 'autoNumber'],
    keys: [
      KeyTypes.index('autoNumber'),
      KeyTypes.foreignKey('autoID').references('auto_inc_table', 'id'),
      KeyTypes.foreignKey('autoNumber').references('auto_inc_table', 'number'),
      KeyTypes.foreignKey('bigID').references('big_table', 'id').onDelete('CASCADE').onUpdate('SET NULL'),
    ],
  };
  const pivotTableExpectedSQL =
    'CREATE TABLE `pivot_table` (\n' +
    '  `autoID` bigint unsigned NOT NULL,\n' +
    '  `autoNumber` mediumint NOT NULL,\n' +
    '  `bigID` bigint unsigned DEFAULT NULL,\n' +
    '  PRIMARY KEY (`autoID`,`autoNumber`),\n' +
    '  KEY `idx_autoNumber` (`autoNumber`),\n' +
    '  KEY `idx_bigID` (`bigID`),\n' +
    '  CONSTRAINT `fk_autoID_pivot_table` FOREIGN KEY (`autoID`) REFERENCES `auto_inc_table` (`id`),\n' +
    '  CONSTRAINT `fk_autoNumber_pivot_table` FOREIGN KEY (`autoNumber`) REFERENCES `auto_inc_table` (`number`),\n' +
    '  CONSTRAINT `fk_bigID_pivot_table` FOREIGN KEY (`bigID`) REFERENCES `big_table` (`id`) ON DELETE CASCADE ON UPDATE SET NULL\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const columnsTableName = 'columns_table';
  const columnsTableSchema = {
    columns: {
      id: ColTypes.int().unsigned().notNull().default(1),
      uuid: ColTypes.char(44).unique(),
      email: ColTypes.char(255),
      fp: ColTypes.float(7, 4),
      dropme: ColTypes.blob(),
      renameme: ColTypes.tinyint(),
      changeme: ColTypes.tinyint(),
      neverchange: ColTypes.tinyint().oldName('fake_column'),
      norename: ColTypes.tinyint().oldName('fake_column'),
    },
    keys: [
      KeyTypes.index('email'),
      KeyTypes.index('id', 'email'),
    ],
  };
  const columnsTableExpectedSQL =
    'CREATE TABLE `columns_table` (\n' +
    '  `id` int unsigned NOT NULL DEFAULT \'1\',\n' +
    '  `uuid` char(44) DEFAULT NULL,\n' +
    '  `email` char(255) DEFAULT NULL,\n' +
    '  `fp` float(7,4) DEFAULT NULL,\n' +
    '  `dropme` blob,\n' +
    '  `renameme` tinyint DEFAULT NULL,\n' +
    '  `changeme` tinyint DEFAULT NULL,\n' +
    '  `neverchange` tinyint DEFAULT NULL,\n' +
    '  `norename` tinyint DEFAULT NULL,\n' +
    '  UNIQUE KEY `uniq_uuid` (`uuid`),\n' +
    '  KEY `idx_email` (`email`),\n' +
    '  KEY `idx_id_email` (`id`,`email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const columnsTableMigratedSchema = {
    columns: {
      id: ColTypes.bigint(5).unsigned().notNull().primaryKey().default(2),
      uuid: ColTypes.char(44).unique(),
      email: ColTypes.varchar(255).notNull(),
      fp: ColTypes.float(8, 3),
      renamed: ColTypes.tinyint().oldName('renameme'),
      changed: ColTypes.smallint().oldName('changeme'),
      neverchange: ColTypes.tinyint().oldName('fake_column'),
      norename: ColTypes.smallint().oldName('fake_column'),
      added: ColTypes.text(),
    },
    keys: [
      KeyTypes.uniqueIndex('email'),
      KeyTypes.index('id', 'email'),
    ],
  };
  const columnsTableMigratedExpectedSQL =
    'CREATE TABLE `columns_table` (\n' +
    '  `id` bigint unsigned NOT NULL DEFAULT \'2\',\n' +
    '  `uuid` char(44) DEFAULT NULL,\n' +
    '  `email` varchar(255) NOT NULL,\n' +
    '  `fp` float(8,3) DEFAULT NULL,\n' +
    '  `renamed` tinyint DEFAULT NULL,\n' +
    '  `changed` smallint DEFAULT NULL,\n' +
    '  `neverchange` tinyint DEFAULT NULL,\n' +
    '  `norename` smallint DEFAULT NULL,\n' +
    '  `added` text,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `uniq_email` (`email`),\n' +
    '  UNIQUE KEY `uniq_uuid` (`uuid`),\n' +
    '  KEY `idx_id_email` (`id`,`email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

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
    '  `a` int NOT NULL,\n' +
    '  `b` char(1) NOT NULL,\n' +
    '  PRIMARY KEY (`a`,`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const primaryKeyTableMigratedSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.char(1),
    },
    primaryKey: 'a',
  };
  const primaryKeyTableMigratedExpectedSQL =
    'CREATE TABLE `pk_table` (\n' +
    '  `a` int NOT NULL,\n' +
    '  `b` char(1) DEFAULT NULL,\n' +
    '  PRIMARY KEY (`a`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const uniqueKeysTableName = 'unique_table';
  const uniqueKeysTableSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.bigint(),
      c: ColTypes.char(1),
    },
    keys: [
      KeyTypes.uniqueIndex('a', 'b'),
      KeyTypes.uniqueIndex('c'),
    ],
  };
  const uniqueKeysTableExpectedSQL =
    'CREATE TABLE `unique_table` (\n' +
    '  `a` int DEFAULT NULL,\n' +
    '  `b` bigint DEFAULT NULL,\n' +
    '  `c` char(1) DEFAULT NULL,\n' +
    '  UNIQUE KEY `uniq_a_b` (`a`,`b`),\n' +
    '  UNIQUE KEY `uniq_c` (`c`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const uniqueKeysTableMigragedSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.bigint(),
      c: ColTypes.char(1),
    },
    keys: [
      KeyTypes.uniqueIndex('a', 'c'),
      KeyTypes.uniqueIndex('b'),
    ],
  };
  const uniqueKeysTableMigratedExpectedSQL =
    'CREATE TABLE `unique_table` (\n' +
    '  `a` int DEFAULT NULL,\n' +
    '  `b` bigint DEFAULT NULL,\n' +
    '  `c` char(1) DEFAULT NULL,\n' +
    '  UNIQUE KEY `uniq_a_c` (`a`,`c`),\n' +
    '  UNIQUE KEY `uniq_b` (`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const indexesTableName = 'indexes_table';
  const indexesTableSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.bigint(),
      c: ColTypes.char(1),
    },
    keys: [
      KeyTypes.index('a', 'b'),
      KeyTypes.index('c'),
    ],
  };
  const indexesTableExpectedSQL =
    'CREATE TABLE `indexes_table` (\n' +
    '  `a` int DEFAULT NULL,\n' +
    '  `b` bigint DEFAULT NULL,\n' +
    '  `c` char(1) DEFAULT NULL,\n' +
    '  KEY `idx_a_b` (`a`,`b`),\n' +
    '  KEY `idx_c` (`c`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const indexesTableMigragedSchema = {
    columns: {
      a: ColTypes.int(),
      b: ColTypes.bigint(),
      c: ColTypes.char(1),
    },
    keys: [
      KeyTypes.index('a', 'c'),
      KeyTypes.index('b'),
    ],
  };
  const indexesTableMigratedExpectedSQL =
    'CREATE TABLE `indexes_table` (\n' +
    '  `a` int DEFAULT NULL,\n' +
    '  `b` bigint DEFAULT NULL,\n' +
    '  `c` char(1) DEFAULT NULL,\n' +
    '  KEY `idx_a_c` (`a`,`c`),\n' +
    '  KEY `idx_b` (`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const spatialIndexesTableName = 'spatial_table';
  const spatialIndexesTableSchema = {
    columns: {
      a: ColTypes.geometry().notNull(),
      b: ColTypes.point().notNull(),
      c: ColTypes.multipolygon().notNull(),
    },
    keys: [
      KeyTypes.spatialIndex('a'),
      KeyTypes.spatialIndex('b'),
    ],
  };
  const spatialIndexesTableExpectedSQL =
    'CREATE TABLE `spatial_table` (\n' +
    '  `a` geometry NOT NULL,\n' +
    '  `b` point NOT NULL,\n' +
    '  `c` multipolygon NOT NULL,\n' +
    '  SPATIAL KEY `sptl_a` (`a`),\n' +
    '  SPATIAL KEY `sptl_b` (`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const spatialIndexesTableMigragedSchema = {
    columns: {
      a: ColTypes.geometry().notNull(),
      b: ColTypes.point().notNull(),
      c: ColTypes.multipolygon().notNull(),
    },
    keys: [
      KeyTypes.spatialIndex('a'),
      KeyTypes.spatialIndex('c'),
    ],
  };
  const spatialIndexesTableMigratedExpectedSQL =
    'CREATE TABLE `spatial_table` (\n' +
    '  `a` geometry NOT NULL,\n' +
    '  `b` point NOT NULL,\n' +
    '  `c` multipolygon NOT NULL,\n' +
    '  SPATIAL KEY `sptl_a` (`a`),\n' +
    '  SPATIAL KEY `sptl_c` (`c`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const fulltextIndexesTableName = 'fulltext_table';
  const fulltextIndexesTableSchema = {
    columns: {
      a: ColTypes.char(32).notNull(),
      b: ColTypes.varchar(255).notNull(),
      c: ColTypes.text().notNull(),
    },
    keys: [
      KeyTypes.fulltextIndex('a'),
      KeyTypes.fulltextIndex('b'),
    ],
  };
  const fulltextIndexesTableExpectedSQL =
    'CREATE TABLE `fulltext_table` (\n' +
    '  `a` char(32) NOT NULL,\n' +
    '  `b` varchar(255) NOT NULL,\n' +
    '  `c` text NOT NULL,\n' +
    '  FULLTEXT KEY `fltxt_a` (`a`),\n' +
    '  FULLTEXT KEY `fltxt_b` (`b`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const fulltextIndexesTableMigragedSchema = {
    columns: {
      a: ColTypes.char(32).notNull(),
      b: ColTypes.varchar(255).notNull(),
      c: ColTypes.text().notNull(),
    },
    keys: [
      KeyTypes.fulltextIndex('a'),
      KeyTypes.fulltextIndex('c'),
    ],
  };
  const fulltextIndexesTableMigratedExpectedSQL =
    'CREATE TABLE `fulltext_table` (\n' +
    '  `a` char(32) NOT NULL,\n' +
    '  `b` varchar(255) NOT NULL,\n' +
    '  `c` text NOT NULL,\n' +
    '  FULLTEXT KEY `fltxt_a` (`a`),\n' +
    '  FULLTEXT KEY `fltxt_c` (`c`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

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
    keys: [
      KeyTypes.index('b'),
      KeyTypes.index('c'),
      KeyTypes.index('d'),
      KeyTypes.index('ai', 'bi'),
      KeyTypes.index('eb', 'fb'),
      KeyTypes.index('gc', 'hc'),
      KeyTypes.foreignKey('ai', 'bi').references('indexes_table', ['a', 'b']),
      KeyTypes.foreignKey('b').references('big_table', ['id']),
      KeyTypes.foreignKey('c').references('big_table', 'id').onDelete('CASCADE').onUpdate('SET NULL'),
      KeyTypes.foreignKey('d').references('columns_table', 'id'),
      KeyTypes.foreignKey('eb').references('big_table', 'name').onDelete('NO ACTION').onUpdate('NO ACTION'),
      KeyTypes.foreignKey('eb', 'fb').references('big_table', ['name', 'letter']),
      KeyTypes.foreignKey('gc').references('columns_table', 'id').onDelete('RESTRICT').onUpdate('RESTRICT'),
      KeyTypes.foreignKey('gc', 'hc').references('columns_table', ['id', 'email']),
    ],
  };
  const foreignKeysTableExpectedSQL =
    'CREATE TABLE `fk_table` (\n' +
    '  `a` bigint unsigned DEFAULT NULL,\n' +
    '  `b` bigint unsigned DEFAULT NULL,\n' +
    '  `c` bigint unsigned DEFAULT NULL,\n' +
    '  `d` int unsigned NOT NULL,\n' +
    '  `ai` int DEFAULT NULL,\n' +
    '  `bi` bigint DEFAULT NULL,\n' +
    '  `eb` varchar(63) DEFAULT NULL,\n' +
    '  `fb` char(1) DEFAULT \'a\',\n' +
    '  `gc` int unsigned NOT NULL,\n' +
    '  `hc` char(255) DEFAULT NULL,\n' +
    '  KEY `idx_b` (`b`),\n' +
    '  KEY `idx_c` (`c`),\n' +
    '  KEY `idx_d` (`d`),\n' +
    '  KEY `idx_ai_bi` (`ai`,`bi`),\n' +
    '  KEY `idx_eb_fb` (`eb`,`fb`),\n' +
    '  KEY `idx_gc_hc` (`gc`,`hc`),\n' +
    '  CONSTRAINT `fk_ai_bi_fk_table` FOREIGN KEY (`ai`, `bi`) REFERENCES `indexes_table` (`a`, `b`),\n' +
    '  CONSTRAINT `fk_b_fk_table` FOREIGN KEY (`b`) REFERENCES `big_table` (`id`),\n' +
    '  CONSTRAINT `fk_c_fk_table` FOREIGN KEY (`c`) REFERENCES `big_table` (`id`) ON DELETE CASCADE ON UPDATE SET NULL,\n' +
    '  CONSTRAINT `fk_d_fk_table` FOREIGN KEY (`d`) REFERENCES `columns_table` (`id`),\n' +
    '  CONSTRAINT `fk_eb_fb_fk_table` FOREIGN KEY (`eb`, `fb`) REFERENCES `big_table` (`name`, `letter`),\n' +
    '  CONSTRAINT `fk_eb_fk_table` FOREIGN KEY (`eb`) REFERENCES `big_table` (`name`),\n' +
    '  CONSTRAINT `fk_gc_fk_table` FOREIGN KEY (`gc`) REFERENCES `columns_table` (`id`),\n' +
    '  CONSTRAINT `fk_gc_hc_fk_table` FOREIGN KEY (`gc`, `hc`) REFERENCES `columns_table` (`id`, `email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

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
    keys: [
      KeyTypes.index('a'),
      KeyTypes.index('c'),
      KeyTypes.index('d'),
      KeyTypes.index('ai', 'ci'),
      KeyTypes.index('gc', 'hc'),
      KeyTypes.uniqueIndex('eb', 'fb'),
      KeyTypes.foreignKey('a').references('big_table', ['id']),
      KeyTypes.foreignKey('ai', 'ci').references('indexes_table', ['a', 'c']),
      KeyTypes.foreignKey('c').references('big_table', 'id').onDelete('SET NULL').onUpdate('CASCADE'),
      KeyTypes.foreignKey('d').references('columns_table', 'id'),
      KeyTypes.foreignKey('eb', 'fb').references('big_table', ['name', 'letter']),
      KeyTypes.foreignKey('gc').references('columns_table', 'id').cascade(),
      KeyTypes.foreignKey('gc', 'hc').references('columns_table', ['id', 'email']),
    ],
  };
  const foreignKeysTableMigratedExpectedSQL =
    'CREATE TABLE `fk_table` (\n' +
    '  `a` bigint unsigned DEFAULT NULL,\n' +
    '  `b` bigint unsigned DEFAULT NULL,\n' +
    '  `c` bigint unsigned DEFAULT NULL,\n' +
    '  `d` bigint unsigned NOT NULL,\n' +
    '  `ai` int DEFAULT NULL,\n' +
    '  `ci` char(1) DEFAULT NULL,\n' +
    '  `eb` varchar(63) DEFAULT NULL,\n' +
    '  `fb` char(1) DEFAULT \'a\',\n' +
    '  `gc` bigint unsigned NOT NULL,\n' +
    '  `hc` varchar(255) NOT NULL,\n' +
    '  UNIQUE KEY `uniq_eb_fb` (`eb`,`fb`),\n' +
    '  KEY `idx_c` (`c`),\n' +
    '  KEY `idx_d` (`d`),\n' +
    '  KEY `idx_gc_hc` (`gc`,`hc`),\n' +
    '  KEY `idx_a` (`a`),\n' +
    '  KEY `idx_ai_ci` (`ai`,`ci`),\n' +
    '  CONSTRAINT `fk_a_fk_table` FOREIGN KEY (`a`) REFERENCES `big_table` (`id`),\n' +
    '  CONSTRAINT `fk_ai_ci_fk_table` FOREIGN KEY (`ai`, `ci`) REFERENCES `indexes_table` (`a`, `c`),\n' +
    '  CONSTRAINT `fk_c_fk_table` FOREIGN KEY (`c`) REFERENCES `big_table` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,\n' +
    '  CONSTRAINT `fk_d_fk_table` FOREIGN KEY (`d`) REFERENCES `columns_table` (`id`),\n' +
    '  CONSTRAINT `fk_eb_fb_fk_table` FOREIGN KEY (`eb`, `fb`) REFERENCES `big_table` (`name`, `letter`),\n' +
    '  CONSTRAINT `fk_gc_fk_table` FOREIGN KEY (`gc`) REFERENCES `columns_table` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,\n' +
    '  CONSTRAINT `fk_gc_hc_fk_table` FOREIGN KEY (`gc`, `hc`) REFERENCES `columns_table` (`id`, `email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

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
    '  `id` int DEFAULT NULL\n' +
    ') ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=ascii COLLATE=ascii_bin ROW_FORMAT=REDUNDANT COMPRESSION=\'zlib\'';

  const optionsTableMigratedSchema = {
    columns: {
      id: ColTypes.int(),
    },
    engine: 'InnoDB',
    charset: 'latin1',
    collate: 'latin1_bin',
    compression: 'NONE',
    rowFormat: 'DEFAULT',
  };
  const optionsTableMigratedExpectedSQL =
    'CREATE TABLE `options_table` (\n' +
    '  `id` int DEFAULT NULL\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_bin COMPRESSION=\'NONE\'';

  const textTableName = 'text_table';
  const textTableSchema = {
    columns: {
      a: ColTypes.char(1),
      // This is no longer safe in MySQL 8 since it uses the charset's default collation instead of the table's
      // b: ColTypes.char(1).charset('utf8mb3'),
      c: ColTypes.char(1).charset('utf8mb3').collate('utf8mb3_unicode_520_ci'),
      d: ColTypes.char(1).collate('utf8mb3_unicode_520_ci'),
      e: ColTypes.char(1).collate('utf8mb3_bin'),
      f: ColTypes.char(1).collate('utf8mb4_bin'),
    },
    charset: 'utf8mb3',
    collate: 'utf8mb3_unicode_520_ci',
  };
  const textTableExpectedSQL =
    'CREATE TABLE `text_table` (\n' +
    '  `a` char(1) COLLATE utf8mb3_unicode_520_ci DEFAULT NULL,\n' +
    // '  `b` char(1) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,\n' +
    '  `c` char(1) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_520_ci DEFAULT NULL,\n' +
    '  `d` char(1) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_520_ci DEFAULT NULL,\n' +
    '  `e` char(1) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL,\n' +
    '  `f` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_520_ci';

  const keyPartsTableName = 'key_parts_table';
  const keyPartsTableSchema = {
    columns: {
      a: ColTypes.char(7).notNull(),
      b: ColTypes.varchar(30),
      c: ColTypes.text(),
    },
    primaryKey: 'a(5)',
    keys: [
      KeyTypes.index('b(20)'),
      KeyTypes.uniqueIndex('c(42)'),
    ],
  };
  const keyPartsTableExpectedSQL =
    'CREATE TABLE `key_parts_table` (\n' +
    '  `a` char(7) NOT NULL,\n' +
    '  `b` varchar(30) DEFAULT NULL,\n' +
    '  `c` text,\n' +
    '  PRIMARY KEY (`a`(5)),\n' +
    '  UNIQUE KEY `uniq_c` (`c`(42)),\n' +
    '  KEY `idx_b` (`b`(20))\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const timestampTableName = 'timestamp_table';
  const timestampTableSchema = {
    columns: {
      a: ColTypes.timestamp().notNull(),
      b: ColTypes.timestamp().notNull().defaultCurrentTimestamp(),
      c: ColTypes.timestamp(),
      d: ColTypes.timestamp().default(null),
      e: ColTypes.timestamp().default('2017-03-25 12:46:05'),
    },
  };
  const timestampTableExpectedSQL =
    'CREATE TABLE `timestamp_table` (\n' +
    '  `a` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n' +
    '  `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n' +
    '  `c` timestamp NULL DEFAULT NULL,\n' +
    '  `d` timestamp NULL DEFAULT NULL,\n' +
    "  `e` timestamp NULL DEFAULT '2017-03-25 12:46:05'\n" +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';

  const synonymTableName = 'synonym_table';
  const synonymTableSchema = {
    columns: {
      a: ColTypes.integer(),
      b: ColTypes.dec(),
      c: ColTypes.numeric(),
      d: ColTypes.fixed(),
      e: ColTypes.bool(),
      f: ColTypes.boolean(),
    },
  };
  const synonymTableExpectedSQL =
    'CREATE TABLE `synonym_table` (\n' +
    '  `a` int DEFAULT NULL,\n' +
    '  `b` decimal(10,0) DEFAULT NULL,\n' +
    '  `c` decimal(10,0) DEFAULT NULL,\n' +
    '  `d` decimal(10,0) DEFAULT NULL,\n' +
    '  `e` tinyint(1) DEFAULT NULL,\n' +
    '  `f` tinyint(1) DEFAULT NULL\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci';


  describe('when creating new tables', () => {

    const pool = MySQLPlus.createPool(config);

    before((done) => {
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableSchema);
      pool.defineTable(indexesTableName, indexesTableSchema);
      pool.defineTable(spatialIndexesTableName, spatialIndexesTableSchema);
      pool.defineTable(fulltextIndexesTableName, fulltextIndexesTableSchema);
      pool.defineTable(foreignKeysTableName, foreignKeysTableSchema);
      pool.defineTable(optionsTableName, optionsTableSchema);
      pool.defineTable(textTableName, textTableSchema);
      pool.defineTable(keyPartsTableName, keyPartsTableSchema);
      pool.defineTable(timestampTableName, timestampTableSchema);
      pool.defineTable(synonymTableName, synonymTableSchema);
      pool.sync(done);
    });

    after((done) => {
      pool.end(done);
    });

    it('should create the tables with the correct structure', (done) => {
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

      const cbFulltext = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${fulltextIndexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(fulltextIndexesTableExpectedSQL);
        cbFulltext();
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

      const cbKeyParts = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${keyPartsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(keyPartsTableExpectedSQL);
        cbKeyParts();
      });

      const cbTimestamp = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${timestampTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(timestampTableExpectedSQL);
        cbTimestamp();
      });

      const cbSynonym = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${synonymTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(synonymTableExpectedSQL);
        cbSynonym();
      });
    });

  });


  describe('when re-defining existing tables without changing them and migrationStrategy = "alter"', () => {

    const pool = MySQLPlus.createPool(config);

    before((done) => {
      sinon.spy(pool, '_runOperations');
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableSchema);
      pool.defineTable(indexesTableName, indexesTableSchema);
      pool.defineTable(spatialIndexesTableName, spatialIndexesTableSchema);
      pool.defineTable(fulltextIndexesTableName, fulltextIndexesTableSchema);
      pool.defineTable(foreignKeysTableName, foreignKeysTableSchema);
      pool.defineTable(optionsTableName, optionsTableSchema);
      pool.defineTable(textTableName, textTableSchema);
      pool.defineTable(keyPartsTableName, keyPartsTableSchema);
      pool.defineTable(timestampTableName, timestampTableSchema);
      pool.defineTable(synonymTableName, synonymTableSchema);
      pool.sync(done);
    });

    after((done) => {
      pool._runOperations.restore();
      pool.end(done);
    });

    it('should not run any table-altering operations', () => {
      pool._runOperations.should.be.calledOnce().and.be.calledWith([]);
    });

    it('should not alter any tables\' structure', (done) => {
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

      const cbFulltext = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${fulltextIndexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(fulltextIndexesTableExpectedSQL);
        cbFulltext();
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

      const cbKeyParts = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${keyPartsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(keyPartsTableExpectedSQL);
        cbKeyParts();
      });

      const cbTimestamp = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${timestampTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(timestampTableExpectedSQL);
        cbTimestamp();
      });

      const cbSynonym = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${synonymTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(synonymTableExpectedSQL);
        cbSynonym();
      });
    });

  });


  describe('when re-defining existing tables and migrationStrategy = "drop"', () => {

    const dropConfig = Object.assign({plusOptions: {migrationStrategy: 'drop'}}, config);
    const pool = MySQLPlus.createPool(dropConfig);

    before((done) => {
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableSchema);
      pool.defineTable(indexesTableName, indexesTableSchema);
      pool.defineTable(spatialIndexesTableName, spatialIndexesTableSchema);
      pool.defineTable(fulltextIndexesTableName, fulltextIndexesTableSchema);
      pool.defineTable(foreignKeysTableName, foreignKeysTableSchema);
      pool.defineTable(optionsTableName, optionsTableSchema);
      pool.defineTable(textTableName, textTableSchema);
      pool.defineTable(keyPartsTableName, keyPartsTableSchema);
      pool.defineTable(timestampTableName, timestampTableSchema);
      pool.defineTable(synonymTableName, synonymTableSchema);
      pool.sync(done);
    });

    after((done) => {
      pool.end(done);
    });

    it('should not alter any tables\' structure', (done) => {
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

      const cbFulltext = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${fulltextIndexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(fulltextIndexesTableExpectedSQL);
        cbFulltext();
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

      const cbKeyParts = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${keyPartsTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(keyPartsTableExpectedSQL);
        cbKeyParts();
      });

      const cbTimestamp = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${timestampTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(timestampTableExpectedSQL);
        cbTimestamp();
      });

      const cbSynonym = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${synonymTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(synonymTableExpectedSQL);
        cbSynonym();
      });
    });

  });


  describe('when migrating existing tables', () => {

    const pool = MySQLPlus.createPool(config);

    before((done) => {
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableMigratedSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableMigratedSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableMigratedSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableMigragedSchema);
      pool.defineTable(indexesTableName, indexesTableMigragedSchema);
      pool.defineTable(spatialIndexesTableName, spatialIndexesTableMigragedSchema);
      pool.defineTable(fulltextIndexesTableName, fulltextIndexesTableMigragedSchema);
      pool.defineTable(foreignKeysTableName, foreignKeysTableMigratedSchema);
      pool.defineTable(optionsTableName, optionsTableMigratedSchema);

      // Insert data into the columns table before syncing the table changes so
      // we can check if the data is still there after some columns get renamed
      pool.query(
        `INSERT INTO ${columnsTableName} (id, email, renameme, changeme) VALUES (1, 'a', 1, 2), (2, 'b', 3, 4)`,
        (err) => {
          if (err) throw err;
          pool.sync(done);
        }
      );
    });

    after((done) => {
      pool.end(done);
    });

    it('should migrate the tables to the correct new structure', (done) => {
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

      const cbFulltext = cbManager.registerCallback();
      pool.query(`SHOW CREATE TABLE \`${fulltextIndexesTableName}\``, (err, result) => {
        if (err) throw err;
        result[0]['Create Table'].should.equal(fulltextIndexesTableMigratedExpectedSQL);
        cbFulltext();
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

    it('should not decrease the AUTO_INCREMENT table option', (done) => {
      const tempPool = MySQLPlus.createPool(config);
      // Try to go back to the original schema
      tempPool.defineTable(autoIncTableName, autoIncTableSchema);
      tempPool.sync((err) => {
        if (err) throw err;

        tempPool.query(`SHOW CREATE TABLE \`${autoIncTableName}\``, (err, result) => {
          if (err) throw err;
          // The schema should not have changed from the migrated version
          result[0]['Create Table'].should.equal(autoIncTableMigratedExpectedSQL);
          tempPool.end(done);
        });
      });
    });

    it('should not lose data when renaming columns', (done) => {
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
