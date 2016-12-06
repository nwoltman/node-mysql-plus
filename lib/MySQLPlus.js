'use strict';

const ColumnDefinitions = require('./ColumnDefinitions');
const PoolPlus = require('./PoolPlus');

const mysql = require('mysql');
const util = require('util');

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
   * @deprecated since version 0.4.0 and will be removed in version 0.5.0.
   * @member module:mysql-plus~Type
   * @see {@link module:mysql-plus~ColTypes|`mysqlPlus.ColTypes`}
   */

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
   *     id: mysql.ColTypes.bigint().unsigned().notNull().primaryKey(),
   *     created: mysql.ColTypes.datetime(),
   *   }
   * });
   */
  ColTypes: ColumnDefinitions,
});

Object.defineProperty(MySQLPlus, 'Type', {
  get: util.deprecate(
    () => MySQLPlus.ColTypes,
    'The `MySQLPlus.Type` property has been deprecated and will be removed in version 0.5.0. ' +
      'Please use the `.ColTypes` property instead.'
  ),
});

/**
 * A function called with the results of a query.
 *
 * @callback module:mysql-plus~queryCallback
 * @param {?Error} error - An `Error` object if an error occurred; `null` otherwise.
 * @param {Array|Object} results - The results of the query.
 * @param {Object[]} fields - Information about the returned results' fields (if any).
 * @see {@link https://github.com/mysqljs/mysql#performing-queries}
 */

module.exports = MySQLPlus;
