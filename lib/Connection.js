'use strict';

const {Connection} = require('mysql2');

/**
 * @class Connection
 * @classdesc The `mysql` module's `Connection` class extended with one extra method. Returned by
 *   {@link https://github.com/mysqljs/mysql#establishing-connections|`mysql.createConnection()`}
 *   and {@link https://github.com/mysqljs/mysql#pooling-connections|`pool.getConnection()`} and
 *   passed to {@link PoolPlus~transactionHandler|`transactionHandler`}.
 */

/**
 * The same as the `query` method except when not passed a callback it returns
 * a promise that resolves with the results of the query.
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
 * connection.pquery('SELECT * FROM `books` WHERE `author` = "David"')
 *   .then((results) => {
 *     // results will contain the results of the query
 *   })
 *   .catch((error) => {
 *     // error will be the Error that occurred during the query
 *   });
 */
Connection.prototype.pquery = function pquery(sql, values, cb) {
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
};
