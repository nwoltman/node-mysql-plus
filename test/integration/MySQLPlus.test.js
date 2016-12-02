'use strict';

const CallbackManager = require('es6-callback-manager');
const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');
const sinon = require('sinon');

const Type = MySQLPlus.Type;

describe('MySQLPlus', function() {

  this.timeout(10000);

  const bigTableName = 'big_table';
  const bigTableSchema = {
    columns: {
      id: Type.bigint().unsigned().notNull().primaryKey().autoIncrement(),
      name: Type.varchar(63),
      email: Type.varchar(255).notNull().unique(),
      password: Type.char(40).notNull(),
      letter: Type.char(1).default('a').index(),
      created: Type.datetime().default('CURRENT_TIMESTAMP'),
      updated: Type.datetime().onUpdateCurrentTimestamp(),
      weirdtext: Type.tinytext().charset('ascii').collate('ascii_bin'),
      zfill: Type.smallint().zerofill(),
      myenum: Type.enum('A', 'B', 'C').default('A'),
      myset: Type.set('ONE', 'TWO'),
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
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `unique_big_table_email` (`email`),\n' +
    '  UNIQUE KEY `unique_big_table_name_letter` (`name`,`letter`),\n' +
    '  UNIQUE KEY `unique_big_table_created` (`created`),\n' +
    '  KEY `index_big_table_letter` (`letter`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const autoIncTableName = 'auto_inc_table';
  const autoIncTableSchema = {
    columns: {
      id: Type.bigint().unsigned().primaryKey().autoIncrement(),
      number: Type.mediumint(),
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
      id: Type.bigint().unsigned().primaryKey().autoIncrement(),
      number: Type.mediumint(),
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
      autoID: Type.bigint().unsigned(),
      autoNumber: Type.mediumint(),
      bigID: Type.bigint().unsigned().index(),
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
      id: Type.int().unsigned().notNull().primaryKey().autoIncrement(),
      uuid: Type.char(44).unique(),
      email: Type.char(255),
      fp: Type.float(7, 4),
      dropme: Type.blob(),
    },
    indexes: ['email'],
  };
  const columnsTableExpectedSQL =
    'CREATE TABLE `columns_table` (\n' +
    '  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `uuid` char(44) DEFAULT NULL,\n' +
    '  `email` char(255) DEFAULT NULL,\n' +
    '  `fp` float(7,4) DEFAULT NULL,\n' +
    '  `dropme` blob,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `unique_columns_table_uuid` (`uuid`),\n' +
    '  KEY `index_columns_table_email` (`email`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const columnsTableMigratedSchema = {
    columns: {
      id: Type.bigint(5).unsigned().notNull().primaryKey().autoIncrement(),
      uuid: Type.char(44).unique(),
      email: Type.varchar(255).notNull(),
      fp: Type.float(8, 3),
      added: Type.text(),
    },
    uniqueKeys: ['email'],
  };
  const columnsTableMigratedExpectedSQL =
    'CREATE TABLE `columns_table` (\n' +
    '  `id` bigint(5) unsigned NOT NULL AUTO_INCREMENT,\n' +
    '  `uuid` char(44) DEFAULT NULL,\n' +
    '  `email` varchar(255) NOT NULL,\n' +
    '  `fp` float(8,3) DEFAULT NULL,\n' +
    '  `added` text,\n' +
    '  PRIMARY KEY (`id`),\n' +
    '  UNIQUE KEY `unique_columns_table_email` (`email`),\n' +
    '  UNIQUE KEY `unique_columns_table_uuid` (`uuid`)\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const primaryKeyTableName = 'pk_table';
  const primaryKeyTableSchema = {
    columns: {
      a: Type.int(),
      b: Type.char(1),
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
      a: Type.int(),
      b: Type.char(1),
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
      a: Type.int(),
      b: Type.bigint(),
      c: Type.char(1),
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
      a: Type.int(),
      b: Type.bigint(),
      c: Type.char(1),
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
      a: Type.int(),
      b: Type.bigint(),
      c: Type.char(1),
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
      a: Type.int(),
      b: Type.bigint(),
      c: Type.char(1),
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

  const foreignKeysTableName = 'fk_table';
  const foreignKeysTableSchema = {
    columns: {
      a: Type.bigint().unsigned(),
      b: Type.bigint().unsigned(),
      c: Type.bigint().unsigned(),
      ai: Type.int(),
      bi: Type.bigint(),
    },
    indexes: ['b', 'c', ['ai', 'bi']],
    foreignKeys: {
      b: 'big_table.id',
      c: {
        table: 'big_table',
        column: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION',
      },
      'ai, bi': {
        table: 'indexes_table',
        column: ['a', 'b'],
      },
    },
  };
  const foreignKeysTableExpectedSQL =
    'CREATE TABLE `fk_table` (\n' +
    '  `a` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `b` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `c` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `ai` int(11) DEFAULT NULL,\n' +
    '  `bi` bigint(20) DEFAULT NULL,\n' +
    '  KEY `index_fk_table_b` (`b`),\n' +
    '  KEY `index_fk_table_c` (`c`),\n' +
    '  KEY `index_fk_table_ai_bi` (`ai`,`bi`),\n' +
    '  CONSTRAINT `fk_fk_table_ai_bi` FOREIGN KEY (`ai`, `bi`) REFERENCES `indexes_table` (`a`, `b`),\n' +
    '  CONSTRAINT `fk_fk_table_b` FOREIGN KEY (`b`) REFERENCES `big_table` (`id`),\n' +
    '  CONSTRAINT `fk_fk_table_c` FOREIGN KEY (`c`) REFERENCES `big_table` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const foreignKeysTableMigratedSchema = {
    columns: {
      a: Type.bigint().unsigned(),
      b: Type.bigint().unsigned(),
      c: Type.bigint().unsigned(),
      ai: Type.int(),
      ci: Type.char(1),
    },
    indexes: ['a', 'c', ['ai', 'ci']],
    foreignKeys: {
      a: 'big_table.id',
      c: {
        table: 'big_table',
        column: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      'ai, ci': {
        table: 'indexes_table',
        column: ['a', 'c'],
      },
    },
  };
  const foreignKeysTableMigratedExpectedSQL =
    'CREATE TABLE `fk_table` (\n' +
    '  `a` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `b` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `c` bigint(20) unsigned DEFAULT NULL,\n' +
    '  `ai` int(11) DEFAULT NULL,\n' +
    '  `ci` char(1) DEFAULT NULL,\n' +
    '  KEY `index_fk_table_c` (`c`),\n' +
    '  KEY `index_fk_table_a` (`a`),\n' +
    '  KEY `index_fk_table_ai_ci` (`ai`,`ci`),\n' +
    '  CONSTRAINT `fk_fk_table_a` FOREIGN KEY (`a`) REFERENCES `big_table` (`id`),\n' +
    '  CONSTRAINT `fk_fk_table_ai_ci` FOREIGN KEY (`ai`, `ci`) REFERENCES `indexes_table` (`a`, `c`),\n' +
    '  CONSTRAINT `fk_fk_table_c` FOREIGN KEY (`c`) REFERENCES `big_table` (`id`) ON DELETE SET NULL ON UPDATE CASCADE\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8';

  const optionsTableName = 'options_table';
  const optionsTableSchema = {
    columns: {
      id: Type.int(),
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
      id: Type.int(),
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
      a: Type.char(1),
      b: Type.char(1).charset('utf8mb4'),
      c: Type.char(1).charset('utf8mb4').collate('utf8mb4_unicode_ci'),
      d: Type.char(1).collate('utf8mb4_unicode_ci'),
      e: Type.char(1).collate('utf8mb4_bin'),
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  };
  const textTableExpectedSQL =
    'CREATE TABLE `text_table` (\n' +
    '  `a` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,\n' +
    '  `b` char(1) CHARACTER SET utf8mb4 DEFAULT NULL,\n' +
    '  `c` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,\n' +
    '  `d` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,\n' +
    '  `e` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL\n' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';


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

    const dropConfig = Object.assign({migrationStrategy: 'drop'}, config);
    const pool = MySQLPlus.createPool(dropConfig);

    before(done => {
      pool.defineTable(bigTableName, bigTableSchema);
      pool.defineTable(autoIncTableName, autoIncTableSchema);
      pool.defineTable(pivotTableName, pivotTableSchema);
      pool.defineTable(columnsTableName, columnsTableSchema);
      pool.defineTable(primaryKeyTableName, primaryKeyTableSchema);
      pool.defineTable(uniqueKeysTableName, uniqueKeysTableSchema);
      pool.defineTable(indexesTableName, indexesTableSchema);
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
      pool.defineTable(foreignKeysTableName, foreignKeysTableMigratedSchema);
      pool.defineTable(optionsTableName, optionsTableMigratedSchema);
      pool.sync(done);
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

  });

});
