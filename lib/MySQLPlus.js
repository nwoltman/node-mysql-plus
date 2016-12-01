'use strict';

const ColumnDefinitions = require('./ColumnDefinitions');
const PoolPlus = require('./PoolPlus');

const mysql = require('mysql');

/**
 * This module.
 * @module mysql-plus
 * @extends mysql
 * @see {@link https://github.com/mysqljs/mysql#mysql|mysql}
 */
const MySQLPlus = Object.assign({}, mysql, {
  /**
   * Just like the original [`mysql.createPool()`](https://github.com/mysqljs/mysql#pooling-connections)
   * method except it returns a {@link PoolPlus|`PoolPlus`} instance and accepts more options.
   *
   * @param {Object} config - A configuration object defining MySQL connection options. In addition to the
   *     possible [mysql connection options](https://github.com/mysqljs/mysql#connection-options),
   *     this object may also have the following two options:
   * @param {string} [config.migrationStrategy] - One of `safe`, `alter`, or `drop`.
   *     Please see the migration strategies documentation [here](#migration-strategies).
   *     Defaults to `safe` in production and `alter` everywhere else.
   * @param {boolean} [config.allowAlterInProduction=false] - Setting this to `true` will
   *     allow `alter` to be used as a migration strategy in production environments.
   * @returns {PoolPlus} A new `PoolPlus` instance.
   *
   * @example
   * const mysql = require('mysql-plus');
   * const pool = mysql.createPool({
   *   host: 'example.org',
   *   user: 'me',
   *   password: 'secret',
   *   migrationStrategy: 'safe',
   *   allowAlterInProduction: false,
   * });
   * pool.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
   *   if (err) throw err;
   *   console.log('The solution is: ', rows[0].solution);
   * });
   */
  createPool(config) {
    return new PoolPlus(config);
  },

  /**
   * A namespace that provides the column type methods used to define columns.
   *
   * @see [Column Types](#column-types)
   *
   * @example
   * const mysql = require('mysql-plus');
   * const pool = mysql.createPool(config);
   * const userTable = pool.defineTable('user', {
   *   columns: {
   *     id: mysql.Type.bigint().unsigned().notNull().primaryKey(),
   *     created: mysql.Type.datetime(),
   *   }
   * });
   */
  Type: ColumnDefinitions,
});

module.exports = MySQLPlus;
