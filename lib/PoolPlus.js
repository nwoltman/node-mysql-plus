/**
 * PoolPlus - Extends MySQL's Pool class
 */

'use strict';

const ColumnDefinitions = require('./ColumnDefinitions');
const MySQLTable = require('./MySQLTable');
const Pool = require('mysql/lib/Pool');
const PoolConfig = require('mysql/lib/PoolConfig');
const SqlString = require('mysql/lib/protocol/SqlString');
const TableDefinition = require('./TableDefinition');

const isEmpty = require('lodash/isEmpty');

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
 * A class that extends the `mysql` module's `Pool` class with the ability to define tables
 * and perform queries and transactions using promises.
 *
 * @extends Pool
 * @see {@link https://github.com/mysqljs/mysql#pooling-connections|Pool}
 */
class PoolPlus extends Pool {
  constructor(config) {
    // TODO: Remove before v0.7.0 is released
    if ('allowAlterInProduction' in config || 'migrationStrategy' in config) {
      throw new Error(
        'The `allowAlterInProduction` and `migrationStrategy` options must now be namespaced under ' +
        'a `plusOptions` property in the config. See the documentation for more information: ' +
        'https://github.com/nwoltman/node-mysql-plus#module_mysql-plus..createPool'
      );
    }

    const plusOptions = config.plusOptions || {};
    validateMigrationStrategy(plusOptions.migrationStrategy);

    super({config: new PoolConfig(config)});

    this._allowAlterInProduction = plusOptions.allowAlterInProduction || false;
    this._debug = plusOptions.debug || false;
    this._migrationStrategy = this._getSanitizedMigrationStrategy(plusOptions.migrationStrategy);
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
  * or migrating existing tables (depending on the migration setting).
  *
  * Generally, this should only be called once when starting up a server.
  *
  * __Warning:__ If an error occurs while syncing, the database will be in an unknown state.
  * Always keep a backup of your database so you can restore it to the latest working state.
  *
  * @param {function} cb - A callback that is called once all defined table schemas have been synced to the
  *     database. If an error occured, the first argument passed to the callback will be the error object.
  * @returns {void}
  *
  * @example
  * pool.sync((err) => {
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

      if (--tablesRemaining > 0) {
        return;
      }

      if (error) {
        cb(error);
        return;
      }

      this._runOperations(allOperations, cb);
    };

    for (const tableDefintion of this._tables.values()) {
      tableDefintion.genSyncOperations(addOperations);
    }
  }

  /**
   * The same as the `query` method on the original mysql `Pool` except when not passed a
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
   * @example
   * pool.pquery('SELECT * FROM `books` WHERE `author` = "David"')
   *   .then((results) => {
   *     // results will contain the results of the query
   *   })
   *   .catch((error) => {
   *     // error will be the Error that occurred during the query
   *   });
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

  /**
   * Begins a transaction and provides a connection to use to make queries during the transaction.
   *
   * __Note:__ Be aware that there are commands in MySQL that can cause an implicit commit, as described
   * in {@link http://dev.mysql.com/doc/refman/5.5/en/implicit-commit.html|the MySQL documentation}.
   *
   * @param {PoolPlus~transactionHandler} trxnHandler - A function that, given a transaction connection,
   *     will make queries and then end the transaction.
   * @return {Promise} A promise that is resolved with the results of the transaction (the value
   *     passed to the `done()` callback or the result of the last returned promise) or is
   *     rejected with the error that caused the transaction to fail.
   *
   * @example <caption>Using the `done` callback</caption>
   * pool.transaction((trxn, done) => {
   *   trxn.query('INSERT INTO `animals` VALUES ("dog")', (err, result) => {
   *     if (err) return done(err);
   *     trxn.query(
   *       'INSERT INTO `pets` (`type`,`name`) VALUES (?, "Rover")',
   *       [result.insertId],
   *       done
   *     );
   *   });
   * }).then(result => {
   *   // result is the result of inserting "Rover" into `pets`
   * }).catch(err => {
   *   // If this is called then the inserts will have been rolled back
   *   // (so "dog" will not be in the `animals` table)
   * });
   *
   * @example <caption>Returning a promise</caption>
   * pool.transaction((trxn) => {
   *   return trxn.pquery('INSERT INTO `animals` (`type`) VALUES ("dog")')
   *     .then(result => trxn.pquery(
   *       'INSERT INTO `pets` (`typeID`,`name`) VALUES (?, "Rover")',
   *       [result.insertId]
   *     ));
   * }).then(result => {
   *   // result is the result of inserting "Rover" into `pets`
   * }).catch(err => {
   *   // An error occurred and the inserts have been rolled back
   * });
   */
  transaction(trxnHandler) {
    return new Promise((resolve, reject) => {
      this.getConnection((err, connection) => {
        if (err) {
          reject(err);
          return;
        }

        function rollback(error) {
          connection.rollback(() => {
            connection.release();
            reject(error);
          });
        }

        function commit(result) {
          connection.commit(err => {
            if (err) {
              rollback(err);
              return;
            }
            connection.release();
            resolve(result);
          });
        }

        function handleDone(err, result) {
          if (err) {
            rollback(err);
          } else {
            commit(result);
          }
        }

        connection.beginTransaction(err => {
          if (err) {
            reject(err);
            return;
          }

          const trxnPromise = trxnHandler(connection, handleDone);
          if (trxnPromise) {
            trxnPromise.then(commit, rollback);
          }
        });
      });
    });
  }
  /**
   * A function that will make queries during a transaction.
   *
   * @callback PoolPlus~transactionHandler
   * @param {Connection} trxn - The transaction connection.
   * @param {function=} done - A callback that can be used to end the transaction.
   * @return {?Promise} If not using the `done` callback, this function must return a promise.
   *     If the promise resolves, the transaction will be committed, and if it rejects, the
   *     transaction will be rolled back. If this function does not return a promise, the
   *     `done` callback must be used or else the transaction will not be committed and
   *     the transaction connection will never be released.
   * @see {@link PoolPlus#transaction|`poolPlus.transaction()`}
   *
   * @example <caption>To fail a transaction using the `done` callback</caption>
   * // Call the `done` callback with a truthy value as the first argument
   * done(error);
   *
   * @example <caption>To complete a transaction using the `done` callback</caption>
   * // Call the `done` callback with a falsy value as the first argument
   * // and pass the results of the transaction as the second argument
   * done(null, results);
   * done(); // Passing results is not required
   *
   * @example <caption>Full example using the `done` callback</caption>
   * function trxnHandler(trxn, done) {
   *   trxn.query('INSERT INTO `animals` (`type`) VALUES ("dog")', (err, animalsResult) => {
   *     if (err) return done(err);
   *     trxn.query(
   *       'INSERT INTO `pets` (`typeID`,`name`) VALUES (?, "Rover")',
   *       [animalsResult.insertId],
   *       (err, petsResult) => {
   *         if (err) return done(err);
   *         done(null, {animalsResult, petsResult});
   *       }
   *     );
   *   });
   * }
   */

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

      var opsLeft = operations.length;
      var errored = false;

      function handleQuery(err) {
        if (errored) {
          return;
        }

        if (err) {
          cb(err);
          errored = true;
          return;
        }

        if (--opsLeft === 0) {
          cb();
        }
      }

      /* istanbul ignore if - Ignore debugging */
      if (this._debug) {
        for (let i = 0; i < opsLeft; i++) {
          connection.query(operations[i].sql, err => { // eslint-disable-line no-loop-func
            if (err && !errored) {
              debugSyncErrorOperation(operations[i]);
              handleQuery(err);
            }
          });
        }
      } else {
        for (let i = 0; i < opsLeft; i++) {
          connection.query(operations[i].sql, handleQuery);
        }
      }
    });

    // Sort the operations while the connection is being fetched
    for (var i = 0; i < operations.length; i++) {
      operations[i].position = i; // Setup for stable sorting
    }
    operations.sort(operationsSorter);

    /* istanbul ignore if - Ignore debugging */
    if (this._debug) {
      debugOperations(operations);
    }
  }
}

// Stable sort by priority (operation type is its priority)
function operationsSorter(a, b) {
  return a.type - b.type || a.position - b.position;
}

/* istanbul ignore next - Ignore debugging */
function debugOperations(operations) {
  console.log();
  console.log('====== mysql-plus operations: ======');
  const opTypes = require('./Operation').Types; // eslint-disable-line global-require
  const opTypeNames = Object.keys(opTypes);
  operations.forEach(operation => {
    console.log();
    console.log('type:', opTypeNames.find(typeName => opTypes[typeName] === operation.type));
    console.log('SQL:', operation.sql);
  });
  console.log();
  console.log('====================================');
  console.log();
}

/* istanbul ignore next - Ignore debugging */
function debugSyncErrorOperation(operation) {
  console.error();
  console.error('====== mysql-plus sync errored on operation: ======');
  const opTypes = require('./Operation').Types; // eslint-disable-line global-require
  const opTypeNames = Object.keys(opTypes);
  console.error();
  console.error('type:', opTypeNames.find(typeName => opTypes[typeName] === operation.type));
  console.error('SQL:', operation.sql);
  console.error();
  console.error('====================================');
  console.error();
}

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
