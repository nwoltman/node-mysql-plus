/**
 * PoolPlus - Extends MySQL's Pool class
 */

'use strict';

const CallbackManager = require('es6-callback-manager');
const ColumnDefinitions = require('./ColumnDefinitions');
const MySQLTable = require('./MySQLTable');
const Pool = require('mysql/lib/Pool');
const PoolConfig = require('mysql/lib/PoolConfig');
const SqlString = require('mysql/lib/protocol/SqlString');
const TableDefinition = require('./TableDefinition');

const isEmpty = require('lodash/isEmpty');
const util = require('util');

const MIGRATION_STRATEGIES = [
  'safe',
  'alter',
  'drop',
];

function validateMigrationStrategy(strategy) {
  if (strategy && MIGRATION_STRATEGIES.indexOf(strategy) < 0) {
    throw new Error(`"${strategy}" is not a valid migration strategy`);
  }
}

/**
 * A class that extends the `mysql` module's `Pool` class with the ability to define tables.
 *
 * @extends Pool
 * @see {@link https://github.com/mysqljs/mysql#pooling-connections|Pool}
 */
class PoolPlus extends Pool {
  constructor(config) {
    validateMigrationStrategy(config.migrationStrategy);
    super({config: new PoolConfig(config)});
    this._allowAlterInProduction = config.allowAlterInProduction || false;
    this._migrationStrategy = this._getSanitizedMigrationStrategy(config.migrationStrategy);
    this._tables = new Map();
  }

  format(sql, values) {
    const connConfig = this.config.connectionConfig;
    if (connConfig.queryFormat) {
      return connConfig.queryFormat.call(this, sql, values, connConfig.timezone);
    }
    return SqlString.format(sql, values, connConfig.stringifyObjects, connConfig.timezone);
  }

  /**
   * Defines a table to be created or updated in the database.
   *
   * @param {string} name - The name of the table.
   * @param {Object} schema - An object that defines the table's schema.
   *     See the [Defining Table Schemas](#defining-table-schemas) section.
   * @param {string} [migrationStrategy] - One of `safe`, `alter`, or `drop`. This will override
   *     the `migrationStrategy` value from the {@link module:mysql-plus~createPool|`config`}
   *     (but is still subject to the same restrictions in production environments).
   * @returns {MySQLTable} A `MySQLTable` instance that lets you perform operations on the table.
   * @see [Defining Table Schemas](#defining-table-schemas)
   *
   * @example
   * const userTable = pool.defineTable('user', {
   *   columns: {
   *     id: pool.ColTypes.bigint().unsigned().notNull().primaryKey().autoIncrement(),
   *     email: pool.ColTypes.varchar(255).notNull().unique(),
   *     created: pool.ColTypes.datetime(),
   *   }
   * });
   */
  defineTable(name, schema, migrationStrategy) {
    if (typeof name !== 'string') {
      throw new Error('The table name must be a string');
    }
    if (this._tables.has(name)) {
      throw new Error(`A table called "${name}" has already been defined for this pool`);
    }
    if (isEmpty(schema.columns)) {
      throw new Error('The schema must have at least one table column');
    }
    validateMigrationStrategy(migrationStrategy);

    migrationStrategy = this._getSanitizedMigrationStrategy(migrationStrategy);
    this._tables.set(name, new TableDefinition(name, schema, this, migrationStrategy));

    return new MySQLTable(name, schema, this);
  }

 /**
  * Syncs the defined tables to the database by creating new tables and dropping
  * or migrating existing tables (depending on the migration setting). Generally
  * should only be called once when starting up a server.
  *
  * @param {function} cb - A callback that is called once all defined table schemas have been synced to the
  *     database. If an error occured, the first argument passed to the callback will be the error object.
  * @returns {void}
  *
  * @example
  * pool.sync(function(err) {
  *   if (err) throw err;
  *   // Now do something such as start an HTTP server
  * });
  */
  sync(cb) {
    var tablesRemaining = this._tables.size;
    if (!tablesRemaining) {
      process.nextTick(cb);
      return;
    }

    var error = null;
    const allOperations = [];
    const addOperations = (err, operations) => {
      if (err) {
        error = error || err;
      } else if (operations.length) {
        allOperations.push.apply(allOperations, operations);
      }
      if (--tablesRemaining === 0) {
        if (error) {
          cb(error);
          return;
        }
        this._runOperations(allOperations, cb);
      }
    };

    for (const tableDefintion of this._tables.values()) {
      tableDefintion.genSyncOperations(addOperations);
    }
  }

  /**
   * The same `query` method as on the original mysql pool except when not passed a
   * callback it returns a promise that resolves with the results of the query.
   *
   * @param {string|Object} sql - An SqlString or options object.
   * @param {Array} [values] - Values to replace placeholders in the SqlString.
   * @param {module:mysql-plus~queryCallback} [cb] - An optional callback that gets called with
   *     the results of the query.
   * @return {?Promise} If the `cb` parameter is omitted, a promise that will resolve with the results
   *     of the query is returned.
   * @see {@link https://github.com/mysqljs/mysql#performing-queries}
   *
   * @example <caption>Promise example</caption>
   * pool.pquery('SELECT * FROM `books` WHERE `author` = "David"')
   *   .then((results) => {
   *     // results will contain the results of the query
   *   })
   *   .catch((error) => {
   *     // error will be the Error that occurred during the query
   *   });
   *
   * @example <caption>Callback example</caption>
   * pool.pquery('SELECT * FROM `books` WHERE `author` = "David"', (error, results, fields) => {
   *   // error will be an Error if one occurred during the query
   *   // results will contain the results of the query
   *   // fields will contain information about the returned results fields (if any)
   * });
   */
  pquery(sql, values, cb) {
    if (typeof (cb || values || sql) === 'function') {
      return this.query(sql, values, cb);
    }

    return new Promise((resolve, reject) => {
      this.query(sql, values, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  _getSanitizedMigrationStrategy(inputStrategy) {
    if (!inputStrategy) {
      return this._migrationStrategy || (process.env.NODE_ENV === 'production' ? 'safe' : 'alter');
    }
    if (
      process.env.NODE_ENV === 'production' &&
      (inputStrategy === 'drop' || inputStrategy === 'alter' && !this._allowAlterInProduction)
    ) {
      return 'safe';
    }
    return inputStrategy;
  }

  _runOperations(operations, cb) {
    if (!operations.length) {
      cb();
      return;
    }

    this.getConnection((err, connection) => {
      if (err) {
        cb(err);
        return;
      }

      const cbManager = new CallbackManager(err => {
        connection.release();
        cb(err);
      });
      for (var i = 0; i < operations.length; i++) {
        connection.query(operations[i].sql, cbManager.registerCallback());
      }
    });

    // Sort the operations while the connection is being fetched
    for (var i = 0; i < operations.length; i++) {
      operations[i].position = i; // Setup for stable sorting
    }
    operations.sort(operationsSorter);
  }
}

// Stable sort by priority (operation type is its priority)
function operationsSorter(a, b) {
  return a.type - b.type || a.position - b.position;
}

/**
 * A namespace that provides the column type methods used to define columns.
 * @deprecated since version 0.4.0 and will be removed in version 0.5.0.
 * @member PoolPlus#Type
 * @see {@link PoolPlus#ColTypes|`poolPlus.ColTypes`}
 */
Object.defineProperty(PoolPlus.prototype, 'Type', {
  get: util.deprecate(
    function() {
      return this.ColTypes;
    },
    'The `pool.Type` property has been deprecated and will be removed in version 0.5.0. ' +
      'Please use the `.ColTypes` property instead.'
  ),
});

/**
 * A namespace that provides the column type methods used to define columns.
 * The exact same thing as {@link module:mysql-plus~ColTypes|`mysqlPlus.ColTypes`}.
 * Just here for convenience.
 *
 * @see [Column Types](#column-types)
 *
 * @example
 * const pool = mysql.createPool(config);
 * const ColTypes = pool.ColTypes;
 * const userTable = pool.defineTable('user', {
 *   columns: {
 *     id: ColTypes.bigint().unsigned().notNull().primaryKey(),
 *     created: ColTypes.datetime(),
 *   }
 * });
 */
PoolPlus.prototype.ColTypes = ColumnDefinitions;

module.exports = PoolPlus;
