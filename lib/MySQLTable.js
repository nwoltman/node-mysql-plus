'use strict';

/**
 * A class that provides convenient methods for performing queries.
 *
 * @see {@link https://github.com/felixge/node-mysql#performing-queries}
 */
class MySQLTable {
  constructor(tableName, schema, pool) {
    /**
     * The table's name (as passed to {@link PoolPlus#defineTable|`poolPlus.defineTable()`}).
     * @constant {string}
     */
    this.tableName = tableName;
    /**
     * The table's schema (as passed to {@link PoolPlus#defineTable|`poolPlus.defineTable()`}).
     * @constant {string}
     */
    this.schema = schema;
    /**
     * The `PoolPlus` instance that created this table.
     * @constant {PoolPlus}
     */
    this.pool = pool;

    this._escapedName = pool.escapeId(tableName);
  }

  /**
   * Selects data from the table.
   *
   * __Note:__ Callers of this method are responsible for escaping
   * any user-input values in the `sqlString` parameter.
   *
   * @param {string|string[]} columns - The name of a column or an array of columns to select.
   *     <br> The special value `*` can be used to select all columns.
   * @param {string} [sqlString] - SQL to be appended to the query after the `FROM table` clause.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString`.
   * @param {function} cb - A callback that gets called with the results of the query.
   * @returns {void}
   *
   * @example <caption>Select all columns</caption>
   * UserTable.select('*', (err, results) => {
   *   if (err) throw err;
   *   // results contains all data for all users
   * }
   *
   * @example <caption>Select a specific column</caption>
   * const values = [5];
   * UserTable.select('email', 'WHERE `id` = ?', values, (err, results) => {
   *   if (err) throw err;
   *   console.log(results); // -> [{email: 'email@example.com'}]
   * }
   *
   * @example <caption>Select specific columns</caption>
   * UserTable.select(['email', 'name'], 'WHERE `points` > 10000', (err, results) => {
   *   if (err) throw err;
   *   console.log(results); // -> [{email: 'email@example.com', name: 'John Doe'}, etc.]
   * }
   *
   * @example <caption>Select with equality conditions</caption>
   * const values = [{id: 5}];
   * UserTable.select('*', 'WHERE ?', values, (err, results) => {
   *   if (err) throw err;
   *   console.log(results); // -> [{id: 5, email: 'email@example.com', name: 'John Doe'}]
   * }
   */
  select(columns, sqlString, values, cb) {
    if (columns !== '*') {
      columns = this.pool.escapeId(columns);
    }
    if (values === undefined) {
      values = sqlString;
      sqlString = '';
    }
    this.pool.query(
      'SELECT ' + columns + ' FROM ' + this._escapedName + ' ' + sqlString,
      values,
      cb
    );
  }

  /**
   * Inserts data into a new row in the table.
   *
   * @param {Object} data - An object of (column name)-(data value) pairs.
   * @param {string} [sqlString] - SQL to be appended to the query.<br>This would only be used to add
   *     an `ON DUPLICATE KEY UPDATE` clause.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString`.
   * @param {MySQLTable~queryCallback} cb - A callback that gets called with the results of the query.
   * @returns {void}
   *
   * @example <caption>Insert a new user</caption>
   * UserTable.insert({email: 'email@example.com', name: 'John Doe'}, (err, result) => {
   *   if (err) throw err;
   *   // data inserted!
   * }
   *
   * @example <caption>Insert or update</caption>
   * const data = {id: 5, points: 100};
   * // If duplicate key (id), add the points
   * const onDuplicateKeySQL = 'ON DUPLICATE KEY UPDATE `points` = `points` + ?';
   * UserTable.insert(data, onDuplicateKeySQL, [data.points], (err, result) => {
   *   if (err) throw err;
   *   // data inserted or updated!
   * }
   */
  insert(data, sqlString, values, cb) {
    if (values === undefined) {
      values = sqlString;
      sqlString = '';
    }
    this.pool.query(
      'INSERT INTO ' + this._escapedName + ' SET ' + this.pool.escape(data) + ' ' + sqlString,
      values,
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
   * @param {Object} data - An object of (column name)-(data value) pairs.
   * @param {MySQLTable~queryCallback} cb - A callback that gets called with the results of the query.
   * @returns {void}
   *
   * @example
   * UserTable.insert({email: 'email@example.com', name: 'John Doe'}, (err, result) => {
   *   if (err) throw err;
   *   // data inserted! (maybe)
   * }
   */
  insertIgnore(data, cb) {
    this.pool.query(
      'INSERT IGNORE INTO ' + this._escapedName + ' SET ' + this.pool.escape(data),
      cb
    );
  }

  /**
   * Replaces a row in the table with new data.
   *
   * @param {Object} data - An object of (column name)-(data value) pairs.
   * @param {MySQLTable~queryCallback} cb - A callback that gets called with the results of the query.
   * @returns {void}
   *
   * @example
   * // `id` is a primary key
   * UserTable.replace({id: 5, email: 'newemail@example.com', name: 'Jane Doe'}, (err, result) => {
   *   if (err) throw err;
   *   // row with id = 5 replaced with new data!
   * }
   */
  replace(data, cb) {
    this.pool.query(
      'REPLACE INTO ' + this._escapedName + ' SET ' + this.pool.escape(data),
      cb
    );
  }

  /**
   * Updates data in the table.
   *
   * __Note:__ Callers of this method are responsible for escaping any user-input values
   * in the `sqlString` parameter. Likewise if the `data` parameter is a string.
   *
   * @param {Object|string} data - An object of (column name)-(data value) pairs or a
   *     string for the `SET` part of the statement. If `data` is an object it will
   *     be escaped so if you want to use a MySQL function to update a value, you'll
   *     need to pass a string with the desired SQL.
   * @param {string} [sqlString] - SQL to be appended to the query after the `SET data` clause.
   *     Using this parameter isn't necessary if `data` is a string.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString` (and/or `data`).
   * @param {MySQLTable~queryCallback} cb - A callback that gets called with the results of the query.
   * @returns {void}
   *
   * @example <caption>With `data` as an object</caption>
   * const data = {email: 'updated@email.com'};
   * const id = 5;
   * UserTable.update(data, 'WHERE `id` = ?', [id], (err, result) => {
   *   if (err) throw err;
   *   // email updated!
   * }
   *
   * @example <caption>With `data` as a string</caption>
   * UserTable.update('`points` = `points` + 1 WHERE `winner` = 1', (err, result) => {
   *   if (err) throw err;
   *   // 1 point added to all winners!
   * }
   *
   * UserTable.update("`word` = CONCAT('prefix', `word`)", (err, result) => {
   *   if (err) throw err;
   *   // prefix added to all words!
   * }
   */
  update(data, sqlString, values, cb) {
    if (typeof data !== 'string') {
      data = this.pool.escape(data);
    }
    if (values === undefined) {
      values = sqlString;
      sqlString = '';
    } else if (typeof sqlString !== 'string') {
      cb = values;
      values = sqlString;
      sqlString = '';
    }
    this.pool.query(
      'UPDATE ' + this._escapedName + ' SET ' + data + ' ' + sqlString,
      values,
      cb
    );
  }

  /**
   * Deletes data from the table.
   *
   * __Note:__ Callers of this method are responsible for escaping
   * any user-input values in the `sqlString` parameter.
   *
   * @param {string} [sqlString] - SQL to be appended to the query after the `FROM table` clause.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString`.
   * @param {MySQLTable~queryCallback} cb - A callback that gets called with the results of the query.
   * @returns {void}
   *
   * @example <caption>Delete specific rows</caption>
   * UserTable.delete('WHERE `spammer` = 1', (err, result) => {
   *   if (err) throw err;
   *   // spammers deleted!
   * }
   *
   * @example <caption>Delete all rows (you probably don't want to do this)</caption>
   * UserTable.delete((err, result) => {
   *   if (err) throw err;
   *   // all rows deleted :(
   * }
   */
  delete(sqlString, values, cb) {
    if (values === undefined) {
      values = sqlString;
      sqlString = '';
    }
    this.pool.query(
      'DELETE FROM ' + this._escapedName + ' ' + sqlString,
      values,
      cb
    );
  }

  /**
   * Exactly the same as [`pool.query()`](https://github.com/felixge/node-mysql#performing-queries).
   *
   * @returns {void}
   */
  query() {
    this.pool.query.apply(this.pool, arguments);
  }
}

/**
 * A function called with the results of a query.
 *
 * @callback MySQLTable~queryCallback
 * @param {?Error} error - An `Error` object if an error occurred; `null` otherwise.
 * @param {Array} results - The results of the query.
 * @param {Array} fields - Information about the returned results' fields (if any).
 * @see {@link https://github.com/felixge/node-mysql#performing-queries}
 */

module.exports = MySQLTable;
