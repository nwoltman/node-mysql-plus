'use strict';

const util = require('util');

/**
 * A class that provides convenient methods for performing queries.
 *
 * @see {@link https://github.com/mysqljs/mysql#performing-queries}
 */
class MySQLTable {
  constructor(name, schema, pool, trxn) {
    /**
     * The table's name (as passed to {@link PoolPlus#defineTable|`poolPlus.defineTable()`}).
     * @deprecated since version 0.4.0 and will be removed in version 0.5.0.
     * @member {string} MySQLTable#tableName
     * @constant {string}
     */
    /**
     * The table's name (as passed to {@link PoolPlus#defineTable|`poolPlus.defineTable()`}).
     * @constant {string}
     */
    this.name = name;
    /**
     * The table's schema (as passed to {@link PoolPlus#defineTable|`poolPlus.defineTable()`}).
     * @constant {Object}
     */
    this.schema = schema;
    /**
     * The `PoolPlus` instance that created this table.
     * @constant {PoolPlus}
     */
    this.pool = pool;
    /**
     * The transaction connection that created this table from a call
     * to {@link MySQLTable#transacting|`table.transacting(trxn)`}.
     * @constant {?Connection}
     */
    this.trxn = trxn;

    this._db = trxn || pool;
    this._escapedName = this._db.escapeId(name);
  }

  /**
   * Selects data from the table.
   *
   * @param {string[]|string} columns - An array of columns to select or a custom `SELECT` string.
   * @param {string} [sqlString] - SQL to be appended to the query after the `FROM table` clause.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString` and `columns`.
   * @param {module:mysql-plus~queryCallback} [cb] - A callback that gets called with the results of the query.
   * @returns {?Promise} If the `cb` parameter is omitted, a promise that will resolve with the results
   *     of the query is returned.
   *
   * @example <caption>Select all columns</caption>
   * userTable.select('*', (err, rows) => {
   *   if (err) throw err;
   *   // rows contains all data for all users
   * });
   *
   * @example <caption>Select specific columns</caption>
   * userTable.select(['email', 'name'], 'WHERE `points` > 10000', (err, rows) => {
   *   if (err) throw err;
   *   console.log(rows); // -> [{email: 'email@example.com', name: 'John Doe'}, etc.]
   * });
   *
   * @example <caption>Select with placeholders</caption>
   * userTable.select(['email'], 'WHERE `id` = ?', [5], (err, rows) => {
   *   if (err) throw err;
   *   console.log(rows); // -> [{email: 'email@example.com'}]
   * });
   *
   * userTable.select('??', 'WHERE ?', ['email', {id: 5}], (err, rows) => {
   *   if (err) throw err;
   *   console.log(rows); // -> [{email: 'email@example.com'}]
   * });
   *
   * @example <caption>Select columns with aliases</caption>
   * userTable.select('`display_name` AS `name`', 'WHERE `points` > 10000', (err, rows) => {
   *   if (err) throw err;
   *   console.log(rows); // -> [{name: 'JohnD'}, etc.]
   * });
   *
   * @example <caption>Select using a function</caption>
   * userTable.select('COUNT(*) AS `highScorers`', 'WHERE `points` > 10000', (err, rows) => {
   *   if (err) throw err;
   *   console.log(rows); // -> [{highScorers: 27}]
   * });
   */
  select(columns, sqlString, values, cb) {
    if (typeof columns !== 'string') {
      columns = this._db.escapeId(columns);
    }
    if (typeof sqlString === 'function') {
      values = sqlString;
      sqlString = '';
    }

    return this._db.pquery(
      'SELECT ' + columns + ' FROM ' + this._escapedName + ' ' + sqlString,
      values,
      cb
    );
  }

  /**
   * Inserts data into a new row in the table.
   *
   * @param {Object|Array} data - An object of (column name)-(data value) pairs or
   *     an array containing either 1) an array of arrays of data values or 2) an array
   *     of column names and the data array from 1).
   * @param {string} [sqlString] - SQL to be appended to the query.<br>This would only be used to add
   *     an `ON DUPLICATE KEY UPDATE` clause.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString`.
   * @param {module:mysql-plus~queryCallback} [cb] - A callback that gets called with the results of the query.
   * @returns {?Promise} If the `cb` parameter is omitted, a promise that will resolve with the results
   *     of the query is returned.
   *
   * @example <caption>Insert a new user</caption>
   * userTable.insert({email: 'email@example.com', name: 'John Doe'}, (err, result) => {
   *   if (err) throw err;
   *   // data inserted!
   * });
   *
   * @example <caption>Insert or update</caption>
   * const data = {id: 5, points: 100};
   * // If duplicate key (id), add the points
   * const onDuplicateKeySQL = 'ON DUPLICATE KEY UPDATE `points` = `points` + ?';
   * userTable.insert(data, onDuplicateKeySQL, [data.points], (err, result) => {
   *   if (err) throw err;
   *   // data inserted or updated!
   * });
   *
   * @example <caption>Bulk insert</caption>
   * const users = [
   *   [1, 'john@email.com', 'John Doe'],
   *   [2, 'jane@email.com', 'Jane Brown'],
   * ];
   * userTable.insert([users], (err, result) => {
   *   if (err) throw err;
   *   // users inserted!
   * });
   *
   * @example <caption>Bulk insert with specified columns</caption>
   * const users = [
   *   ['john@email.com', 'John Doe'],
   *   ['jane@email.com', 'Jane Brown'],
   * ];
   * userTable.insert([['email', 'name'], users], (err, result) => {
   *   if (err) throw err;
   *   // users inserted!
   * });
   */
  insert(data, sqlString, values, cb) {
    if (cb) {
      sqlString = this._db.format(sqlString, values);
    } else if (values) {
      if (typeof values === 'function') {
        cb = values;
      } else {
        sqlString = this._db.format(sqlString, values);
      }
    } else if (sqlString === undefined) {
      sqlString = '';
    } else if (typeof sqlString === 'function') {
      cb = sqlString;
      sqlString = '';
    }

    if (data instanceof Array) {
      return this._db.pquery(
        'INSERT INTO ' + this._escapedName + (data.length > 1 ? ' (??)' : '') + ' VALUES  ?',
        data,
        cb
      );
    }

    return this._db.pquery(
      'INSERT INTO ' + this._escapedName + ' SET ' + this._db.escape(data) + ' ' + sqlString,
      cb
    );
  }

  /**
   * Inserts data into a new row in the table. The row is not
   * inserted if it would result in a duplicate key error.
   *
   * __Note:__ Be aware that if the insert is ignored, the table's `AUTO_INCREMENT`
   * value (if there is one) may be incremented anyway due to a bug in MySQL.
   *
   * @deprecated since version 0.4.0 and will be removed in version 0.5.0.
   * @param {Object} data - An object of (column name)-(data value) pairs.
   * @param {module:mysql-plus~queryCallback} cb - A callback that gets called with the results of the query.
   * @returns {void}
   *
   * @example
   * userTable.insertIgnore({email: 'email@example.com', name: 'John Doe'}, (err, result) => {
   *   if (err) throw err;
   *   // data inserted! (maybe)
   * });
   */
  insertIgnore(data, cb) {
    this._db.query(
      'INSERT IGNORE INTO ' + this._escapedName + ' SET ' + this._db.escape(data),
      cb
    );
  }

  /**
   * Replaces a row in the table with new data.
   *
   * @deprecated since version 0.4.0 and will be removed in version 0.5.0.
   * @param {Object} data - An object of (column name)-(data value) pairs.
   * @param {module:mysql-plus~queryCallback} cb - A callback that gets called with the results of the query.
   * @returns {void}
   *
   * @example
   * // `id` is a primary key
   * userTable.replace({id: 5, email: 'newemail@example.com', name: 'Jane Doe'}, (err, result) => {
   *   if (err) throw err;
   *   // row with id = 5 replaced with new data!
   * });
   */
  replace(data, cb) {
    this._db.query(
      'REPLACE INTO ' + this._escapedName + ' SET ' + this._db.escape(data),
      cb
    );
  }

  /**
   * Updates data in the table.
   *
   * __Note:__ The `data` and `sqlString` arguments are individually
   * optional but at least one of them must be specified.
   *
   * @param {Object} [data] - An object of (column name)-(data value) pairs that define the new column values.
   *     This object will be escaped by `mysql.escape()` so if you want to use more sophisticated SQL (such as
   *     a MySQL function) to update a column's value, you'll need to use the `sqlString` argument instead.
   * @param {string} [sqlString] - SQL to be appended to the query after the `SET data` clause
   *     or immediately after `SET ` if `data` is omitted.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString` (and/or `data`).
   * @param {module:mysql-plus~queryCallback} [cb] - A callback that gets called with the results of the query.
   * @returns {?Promise} If the `cb` parameter is omitted, a promise that will resolve with the results
   *     of the query is returned.
   *
   * @example <caption>With both the `data` and `sqlString` arguments</caption>
   * userTable.update({email: 'updated@email.com'}, 'WHERE `id` = ?', [5], (err, result) => {
   *   if (err) throw err;
   *   // email updated!
   * });
   *
   * @example <caption>With only the `sqlString` argument</caption>
   * userTable.update("`word` = CONCAT('prefix', `word`)", (err, result) => {
   *   if (err) throw err;
   *   // prefix added to all words!
   * });
   *
   * userTable.update('`points` = `points` + ? WHERE `winner` = ?', [1, 1], (err, result) => {
   *   if (err) throw err;
   *   // 1 point added to all winners!
   * });
   *
   * @example <caption>With only the `data` argument (updates all rows)</caption>
   * userTable.update({points: 1000}, (err, result) => {
   *   if (err) throw err;
   *   // Now everyone has 1000 points!
   * });
   */
  update(data, sqlString, values, cb) {
    if (typeof data === 'string') {
      return this._db.pquery(
        'UPDATE ' + this._escapedName + ' SET ' + data,
        sqlString,
        values
      );
    }

    if (cb) {
      sqlString = this._db.format(sqlString, values);
    } else if (values) {
      if (typeof values === 'function') {
        cb = values;
      } else {
        sqlString = this._db.format(sqlString, values);
      }
    } else if (sqlString === undefined) {
      sqlString = '';
    } else if (typeof sqlString === 'function') {
      cb = sqlString;
      sqlString = '';
    }

    return this._db.pquery(
      'UPDATE ' + this._escapedName + ' SET ' + this._db.escape(data) + ' ' + sqlString,
      cb
    );
  }

  /**
   * Deletes data from the table.
   *
   * @param {string} [sqlString] - SQL to be appended to the query after the `FROM table` clause.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString`.
   * @param {module:mysql-plus~queryCallback} [cb] - A callback that gets called with the results of the query.
   * @returns {?Promise} If the `cb` parameter is omitted, a promise that will resolve with the results
   *     of the query is returned.
   *
   * @example <caption>Delete specific rows</caption>
   * userTable.delete('WHERE `spammer` = 1', (err, result) => {
   *   if (err) throw err;
   *   // spammers deleted!
   * });
   *
   * @example <caption>Delete all rows (you probably don't want to do this)</caption>
   * userTable.delete((err, result) => {
   *   if (err) throw err;
   *   // all rows deleted :(
   * });
   */
  delete(sqlString, values, cb) {
    if (sqlString === undefined || typeof sqlString === 'function') {
      values = sqlString;
      sqlString = '';
    }
    return this._db.pquery(
      'DELETE FROM ' + this._escapedName + ' ' + sqlString,
      values,
      cb
    );
  }

  /**
   * Exactly the same as {@link PoolPlus#pquery|`pool.pquery()`}.
   *
   * @returns {?Promise}
   */
  query(sql, values, cb) {
    return this._db.pquery(sql, values, cb);
  }

  /**
   * Returns a new `MySQLTable` instance that will perform queries using the provided transaction connection.
   *
   * @param {Connection} trxn - The transaction connection that will be used to perform queries.
   * @return {MySQLTable} A new `MySQLTable` instance that will perform queries using the provided transaction
   *     connection instead of the `PoolPlus` instance that was used to create the original instance.
   * @see {@link PoolPlus#transaction|`pool.transaction()`}
   *
   * @example
   * const animalsTable = pool.defineTable('animals', schema);
   * const petsTable = pool.defineTable('pets', schema);
   *
   * pool.transaction((trxn) => {
   *   return animalsTable.transacting(trxn)
   *     .insert({type: 'dog'})
   *     .then(result =>
   *       petsTable.transacting(trxn)
   *         .insert({typeID: result.insertId, name: 'Rover'})
   *     );
   * }).then(result => {
   *   // result is the result of inserting "Rover" into the pets table
   * }).catch(err => {
   *   // An error occurred during the transaction
   * });
   */
  transacting(trxn) {
    return new MySQLTable(this.name, this.schema, this.pool, trxn);
  }
}

MySQLTable.prototype.insertIgnore = util.deprecate(
  MySQLTable.prototype.insertIgnore,
  'The `mySQLTable.insertIgnore()` method has been deprecated and will be removed in version 0.5.0. ' +
    'Use `.insert()` with an `ON DUPLICATE KEY` clause instead.'
);

MySQLTable.prototype.replace = util.deprecate(
  MySQLTable.prototype.replace,
  'The `mySQLTable.replace()` method has been deprecated and will be removed in version 0.5.0. ' +
    'Use `.delete()` then `.insert()` instead.'
);

Object.defineProperty(MySQLTable.prototype, 'tableName', {
  get: util.deprecate(
    function() {
      return this.name;
    },
    'The `mySQLTable.tableName` property has been deprecated and will be removed in version 0.5.0. ' +
      'Please use the `name` property instead.'
  ),
});

module.exports = MySQLTable;
