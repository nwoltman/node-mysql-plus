'use strict';

/**
 * A class that provides convenient methods for performing queries.<br>To create
 * an instance, use {@link PoolPlus#defineTable|`poolPlus.defineTable()`} or
 * {@link PoolPlus#basicTable|`poolPlus.basicTable()`}.
 *
 * @see {@link https://github.com/mysqljs/mysql#performing-queries}
 */
class MySQLTable {
  constructor(name, schema, pool, trxn) {
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
   * // SELECT * FROM `user`;
   *
   * @example <caption>Select specific columns</caption>
   * userTable.select(['email', 'name'], 'WHERE `points` > 10000', (err, rows) => {
   *   if (err) throw err;
   *   console.log(rows); // -> [{email: 'email@example.com', name: 'John Doe'}, ...]
   * });
   *
   * // SELECT `email`, `name` FROM `user` WHERE `points` > 10000;
   *
   * @example <caption>Select with placeholders</caption>
   * userTable.select(['email'], 'WHERE `id` = ?', [5])
   *   .then(rows => console.log(rows)); // -> [{email: 'email@example.com'}]
   *
   * // SELECT `email` FROM `user` WHERE `id` = 5;
   *
   *
   * userTable.select('??', 'WHERE ?', ['email', {id: 5}])
   *   .then(rows => console.log(rows)); // -> [{email: 'email@example.com'}]
   *
   * // SELECT `email` FROM `user` WHERE `id` = 5;
   *
   * @example <caption>Select columns with aliases</caption>
   * userTable.select('`name` AS `fullName`', 'WHERE `points` > 10000')
   *   .then(rows => console.log(rows)); // -> [{fullName: 'John Doe'}, ...]
   *
   * // SELECT `name` AS `fullName` FROM `user` WHERE `points` > 10000;
   *
   * @example <caption>Select using a function</caption>
   * userTable.select('COUNT(*) AS `highScorers`', 'WHERE `points` > 10000')
   *   .then(rows => console.log(rows)); // -> [{highScorers: 27}]
   *
   * // SELECT COUNT(*) AS `highScorers` FROM `user` WHERE `points` > 10000;
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
  * Checks if rows in the table exist.
  *
  * @param {string} sqlString - SQL that specifies rows to check for existence.<br>
  *     The first example shows how this parameter is used in the query.
  * @param {Array} [values] - Values to replace the placeholders in `sqlString`.
  * @param {module:mysql-plus~queryCallback} [cb] - A callback that gets called with
  *     the results of the query where the `results` will be either `true` or `false`.
  * @returns {?Promise} If the `cb` parameter is omitted, a promise that will
  *     resolve with either `true` or `false` is returned.
  *
  * @example <caption>Using a promise</caption>
  * userTable.exists('WHERE `id` > 10')
  *   .then(exists => console.log(exists)); // true or false
  *
  * // SELECT EXISTS (
  * //   SELECT 1 FROM `user`
  * //   WHERE `id` > 10  # This is where `sqlString` gets inserted
  * //   LIMIT 1
  * // )
  *
  * @example <caption>Using a callback and the `values` argument</caption>
  * userTable.exists('WHERE `id` = ?', [10], (err, exists) => {
  *   if (err) throw err;
  *   console.log(exists); // true or false
  * });
  */
  exists(sqlString, values, cb) {
    if (typeof values === 'function') {
      cb = values;
      values = undefined;
    }

    sqlString = 'SELECT EXISTS ( SELECT 1 FROM ' + this._escapedName + ' ' + sqlString + ' LIMIT 1 ) as `exists`';

    if (!cb) {
      return this._db.pquery(sqlString, values).then(checkExists);
    }

    this._db.query(sqlString, values, (err, rows) => {
      if (err) {
        cb(err);
        return;
      }

      cb(null, checkExists(rows));
    });

    return undefined;
  }

  /**
   * Inserts data into a new row in the table.
   *
   * __Note:__ The `data` and `sqlString` arguments are individually
   * optional but at least one of them must be specified.
   *
   * @param {Object|Array} [data] - An object of (column name)-(data value) pairs or
   *     an array containing either 1) an array of arrays of data values or 2) an array
   *     of column names and the data array from 1).
   * @param {string} [sqlString] - SQL to be appended to the query. If `data` is provided, it is appended
   *     directly after the formatted data, otherwise it is appended after `"INSERT INTO tableName"`.
   * @param {Array} [values] - Values to replace the placeholders in `sqlString`.
   * @param {module:mysql-plus~queryCallback} [cb] - A callback that gets called with the results of the query.
   * @returns {?Promise} If the `cb` parameter is omitted, a promise that will resolve with the results
   *     of the query is returned.
   *
   * @example <caption>Insert a new user</caption>
   * userTable.insert({email: 'email@example.com', name: 'John Doe'})
   *   .then(result => result.affectedRows); // 1
   *
   * // INSERT INTO `user`
   * // SET `email` = 'email@example.com', `name` = 'John Doe';
   *
   * @example <caption>Insert or update</caption>
   * const data = {id: 5, points: 100};
   * // If duplicate key (id), add the points
   * const onDuplicateKeySQL = 'ON DUPLICATE KEY UPDATE `points` = `points` + ?';
   * userTable.insert(data, onDuplicateKeySQL, [data.points])
   *   .then(result => result.affectedRows); // 1 if inserted, 2 if updated
   *
   * // INSERT INTO `user` SET `id` = 5, `points` = 100
   * // ON DUPLICATE KEY UPDATE `points` = `points` + 100;
   *
   * @example <caption>With only the `sqlString` argument</caption>
   * placeTable.insert('SET `location` = POINT(0, 0)');
   * // INSERT INTO `place` SET `location` = POINT(0, 0);
   *
   * placeTable.insert('(`location`) VALUES (POINT(?, ?))', [8, 2]);
   * // INSERT INTO `place` (`location`) VALUES (POINT(8, 2));
   *
   * @example <caption>Bulk insert</caption>
   * const users = [
   *   [1, 'john@email.com', 'John Doe'],
   *   [2, 'jane@email.com', 'Jane Brown'],
   * ];
   * userTable.insert([users])
   *   .then(result => result.insertId); // 2 (ID of the last inserted row)
   *
   * // INSERT INTO `user` VALUES
   * // (1, 'john@email.com', 'John Doe'),
   * // (2, 'jane@email.com', 'Jane Brown');
   *
   * @example <caption>Bulk insert with specified columns</caption>
   * const users = [
   *   ['john@email.com', 'John Doe'],
   *   ['jane@email.com', 'Jane Brown'],
   * ];
   * userTable.insert([['email', 'name'], users])
   *   .then(result => result.affectedRows); // 2
   *
   * // INSERT INTO `user` (`email`, `name`) VALUES
   * // ('john@email.com', 'John Doe'),
   * // ('jane@email.com', 'Jane Brown');
   */
  insert(data, sqlString, values, cb) {
    if (typeof data === 'string') {
      return this._db.pquery(
        'INSERT INTO ' + this._escapedName + ' ' + data,
        sqlString,
        values
      );
    }

    if (typeof sqlString === 'string') {
      if (typeof values === 'object') {
        sqlString = this._db.format(sqlString, values);
      } else {
        cb = values;
      }
    } else {
      cb = sqlString;
      sqlString = '';
    }

    if (data instanceof Array) {
      data = data.length > 1
        ? ' (' + this._db.escapeId(data[0]) + ') VALUES ' + this._db.escape(data[1])
        : ' VALUES ' + this._db.escape(data[0]);

      return this._db.pquery(
        'INSERT INTO ' + this._escapedName + data + ' ' + sqlString,
        cb
      );
    }

    return this._db.pquery(
      'INSERT INTO ' + this._escapedName + ' SET ' + this._db.escape(data) + ' ' + sqlString,
      cb
    );
  }

  /**
   * Inserts a new row into the table if there are no existing rows in
   * the table that have the same values for the specified columns.
   *
   * This is useful because if the row is not inserted, the table's
   * `AUTO_INCREMENT` value is not increased (unlike when an insert
   * fails because of a unique key constraint).
   *
   * @param {Object} data - An object mapping column names to data values to insert.
   *     The values are escaped by default. If you don't want a value to be escaped,
   *     wrap it in a "raw" object (see the last example below).
   * @param {string[]} keyColumns - The names of columns in the `data` object.
   *     If there is already a row in the table with the same values for these
   *     columns as the values being inserted, the data will not be inserted.
   * @param {module:mysql-plus~queryCallback} [cb] - A callback that gets called with the results of the query.
   * @returns {?Promise} If the `cb` parameter is omitted, a promise that will
   *     resolve with the results of the query is returned.
   *
   * @example <caption>Insert a new user if a user with the same email does not exist</caption>
   * userTable.insertIfNotExists({email: 'email@example.com', name: 'John Doe'}, ['email'])
   *   .then(result => result.affectedRows);
   *   // 0 - If there was a row with `email` = 'email@example.com' (row not inserted)
   *   // 1 - If there wasn't (row was inserted)
   *
   * // INSERT INTO `user` (`email`, `name`)
   * // SELECT 'email@example.com', 'John Doe'
   * // FROM DUAL WHERE NOT EXISTS (
   * //   SELECT 1 FROM `user`
   * //   WHERE `email` = 'email@example.com' LIMIT 1
   * // );
   *
   * @example <caption>Insert without escaping some values</caption>
   * const data = {
   *   placeId: 'ChIJK2f-X1bxK4gRkB0jxyh7AwU',
   *   type: 'city',
   *   // IMPORTANT: You must manually escape any user-input values used in the "raw" object.
   *   location: {__raw: 'POINT(-80.5204096, 43.4642578)'},
   * };
   * placeTable.insertIfNotExists(data, ['placeId', 'type'])
   *   .then(result => result.affectedRows);
   *   // 0 - If there was a row with the same `placeId` and `type` (row not inserted)
   *   // 1 - If there wasn't (row was inserted)
   *
   * // INSERT INTO `place` (`placeId`, `type`, `location`)
   * // SELECT 'ChIJK2f-X1bxK4gRkB0jxyh7AwU', 'city', POINT(-80.5204096, 43.4642578)
   * // FROM DUAL WHERE NOT EXISTS (
   * //   SELECT 1 FROM `place`
   * //   WHERE `placeId` = 'ChIJK2f-X1bxK4gRkB0jxyh7AwU' AND `type` = 'city' LIMIT 1
   * // );
   */
  insertIfNotExists(data, keyColumns, cb) {
    const db = this._db;
    var columnNames = '';
    var insertValues = '';
    var whereClause = '';

    for (var dataColumnName in data) {
      columnNames += (columnNames ? ',' : '') + db.escapeId(dataColumnName);
      insertValues += (insertValues ? ',' : '') + this._rawEscape(data[dataColumnName]);
    }

    for (var i = 0; i < keyColumns.length; i++) {
      var keyColumnName = keyColumns[i];
      whereClause += (i > 0 ? ' AND ' : '') +
        db.escapeId(keyColumnName) + '=' + this._rawEscape(data[keyColumnName]);
    }

    return db.pquery(
      `INSERT INTO ${this._escapedName} (${columnNames}) SELECT ${insertValues} FROM DUAL ` +
        `WHERE NOT EXISTS(SELECT 1 FROM ${this._escapedName} WHERE ${whereClause} LIMIT 1)`,
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
   * userTable.update({email: 'updated@email.com'}, 'WHERE `id` = ?', [5])
   *   .then(result => result.changedRows); // 1
   *
   * // UPDATE `user` SET `email` = 'updated@email.com'
   * // WHERE `id` = 5;
   *
   * @example <caption>With only the `sqlString` argument</caption>
   * userTable.update("`word` = CONCAT('prefix', `word`)");
   * // UPDATE `user` SET `word` = CONCAT('prefix', `word`);
   *
   * userTable.update('`points` = `points` + ? WHERE `winner` = ?', [10, 1]);
   * // UPDATE `user` SET `points` = `points` + 10
   * // WHERE `winner` = 1;
   *
   * @example <caption>With only the `data` argument (updates all rows)</caption>
   * userTable.update({points: 1000});
   * // UPDATE `user` SET `points` = 1000;
   */
  update(data, sqlString, values, cb) {
    if (typeof data === 'string') {
      return this._db.pquery(
        'UPDATE ' + this._escapedName + ' SET ' + data,
        sqlString,
        values
      );
    }

    if (typeof sqlString === 'string') {
      if (typeof values === 'object') {
        sqlString = this._db.format(sqlString, values);
      } else {
        cb = values;
      }
    } else {
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
   * userTable.delete('WHERE `spammer` = 1')
   *   .then(result => result.affectedRows); // The number of deleted spammers
   *
   * // DELETE FROM `user` WHERE `spammer` = 1;
   *
   * @example <caption>Delete all rows (you probably don't want to do this)</caption>
   * userTable.delete((err, result) => {
   *   if (err) throw err;
   *   // all rows deleted :(
   * });
   *
   * // DELETE FROM `user`;
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

  _rawEscape(value) {
    return value && value.__raw !== undefined
      ? value.__raw
      : this._db.escape(value);
  }
}

function checkExists(rows) {
  // Must convert the result to a number because mysql will return a string if the
  // user set the "supportBigNumbers" and "bigNumberStrings" options to `true`.
  return +rows[0].exists === 1;
}

module.exports = MySQLTable;
