'use strict';

const ColumnDefinitions = require('./ColumnDefinitions');
const KeyDefinitions = require('./KeyDefinitions');
const PoolPlus = require('./PoolPlus');

const mysql = require('mysql');

require('./Connection'); // Extends mysql Connection

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
   * @param {Object} config - A configuration object defining MySQL connection options. In addition to
   *     the, possible [mysql connection options](https://github.com/mysqljs/mysql#connection-options),
   *     this object may also have a `plusOptions` property to configure the {@link PoolPlus|`PoolPlus`}
   *     instance, it returns.
   * @param {Object} [config.plusOptions] - An optional configuration object that may have the following properties:
   * @param {string} [config.plusOptions.migrationStrategy] - One of `safe`, `alter`, or `drop`.
   *     Please see the migration strategies documentation [here](#migration-strategies).
   *     Defaults to `safe` in production and `alter` everywhere else.
   * @param {boolean} [config.plusOptions.allowAlterInProduction=false] - Setting this to `true` will
   *     allow `alter` to be used as a migration strategy in production environments.
   * @param {boolean} [config.plusOptions.debug=false] - If set to `true`, all of the SQL operations
   *     that will be performed will be printed to the console.
   * @returns {PoolPlus} A new `PoolPlus` instance.
   *
   * @example
   * const mysql = require('mysql-plus');
   * const pool = mysql.createPool({
   *   host: 'example.org',
   *   user: 'me',
   *   password: 'secret',
   *   plusOptions: {
   *     migrationStrategy: 'safe',
   *     allowAlterInProduction: true,
   *     debug: true,
   *   },
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
   *     id: mysql.ColTypes.bigint().unsigned().notNull().primaryKey(),
   *     created: mysql.ColTypes.datetime(),
   *   }
   * });
   */
  ColTypes: ColumnDefinitions,

  /**
   * A namespace that provides the key type methods used to define keys.
   *
   * @see [Key Types](#key-types)
   *
   * @example
   * const mysql = require('mysql-plus');
   * const pool = mysql.createPool(config);
   * const userTable = pool.defineTable('user', {
   *   columns: {
   *     id: mysql.ColTypes.bigint().unsigned().notNull().primaryKey(),
   *     uid: mysql.ColTypes.varchar(32).notNull(),
   *     created: mysql.ColTypes.datetime(),
   *   },
   *   keys: [
   *     mysql.KeyTypes.uniqueIndex('uid'),
   *     mysql.KeyTypes.index('created'),
   *   ],
   * });
   */
  KeyTypes: KeyDefinitions,
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
