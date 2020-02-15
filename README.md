# mysql-plus

[![NPM Version](https://img.shields.io/npm/v/mysql-plus.svg)](https://www.npmjs.com/package/mysql-plus)
[![Build Status](https://travis-ci.org/nwoltman/node-mysql-plus.svg?branch=master)](https://travis-ci.org/nwoltman/node-mysql-plus)
[![Coverage Status](https://coveralls.io/repos/github/nwoltman/node-mysql-plus/badge.svg?branch=master)](https://coveralls.io/github/nwoltman/node-mysql-plus?branch=master)
[![dependencies Status](https://david-dm.org/nwoltman/node-mysql-plus/status.svg)](https://david-dm.org/nwoltman/node-mysql-plus)
[![devDependencies Status](https://david-dm.org/nwoltman/node-mysql-plus/dev-status.svg)](https://david-dm.org/nwoltman/node-mysql-plus?type=dev)

A MySQL client for Node.js that makes defining tables easy and automatically migrates table schemas.

This module extends the popular [`mysql`](https://www.npmjs.com/package/mysql) module, so it is recommended that you read the [`mysql` documentation](https://github.com/mysqljs/mysql#introduction), especially the sections on [connection options](https://github.com/mysqljs/mysql#connection-options), [performing queries](https://github.com/mysqljs/mysql#performing-queries), [escaping query values](https://github.com/mysqljs/mysql#escaping-query-values), and [escaping query identifiers](https://github.com/mysqljs/mysql#escaping-query-identifiers).

## Table of Contents

+ [Installation](#installation)
+ [Usage Example](#usage-example)
+ [API](#api)
  + Modules
    + [mysql-plus](#module_mysql-plus)
  + Classes
    + [PoolPlus](#PoolPlus)
    + [Connection](#Connection)
    + [MySQLTable](#MySQLTable)
  + Info
    + [Migration Strategies](#migration-strategies)
    + [Defining Table Schemas](#defining-table-schemas)
    + [Column Types](#column-types)
    + [Key Types](#key-types)

## Installation

```sh
npm install mysql-plus
# or
yarn add mysql-plus
```

## Usage Example

#### db.js

```js
const mysql = require('mysql-plus');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'username',
  password: 'secret',
  database: 'my_db',
});
// Both `mysql` and `pool` are 100% compatible with the mysql module
module.exports = pool;
```

#### User.js

```js
const db = require('./db');

const userTable = db.defineTable('user', {
  columns: {
    id: db.ColTypes.bigint().unsigned().notNull().primaryKey().autoIncrement(),
    email: db.ColTypes.varchar(255).notNull().unique(),
    name: db.ColTypes.varchar(63).notNull(),
  },
});

const User = {
  async insertAndSelectExample() {
    const result = await userTable.insert({email: 'newuser@email.com', name: 'newuser'})
    const rows = await userTable.select('*', 'WHERE `id` = ?', [result.insertId]))
    console.log(rows); // [ { id: 1, email: 'newuser@email.com', name: 'newuser' } ]
    return rows[0];
  }
};

module.exports = User;
```

#### app.js (Express example)

```js
const db = require('./db');
const User = require('./User');
const express = require('express');
const app = express();

app.get('/user', async (req, res, next) => {
  try {
    const user = await User.insertAndSelectExample();
    res.send(user);
  } catch (err) {
    next(err)
  }
})

// Sync the table schemas to the database
db.sync((err) => {
  if (err) throw err;
  // Now the server can be safely started
  app.listen(/*...*/);
});
```


# API

## Modules

<dl>
<dt><a href="#module_mysql-plus">mysql-plus</a> ⇐ <code>mysql</code></dt>
<dd><p>This module.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#PoolPlus">PoolPlus</a> ⇐ <code>Pool</code></dt>
<dd><p>A class that extends the <code>mysql</code> module&#39;s <code>Pool</code> class with the ability to define tables
and perform queries and transactions using promises.</p>
</dd>
<dt><a href="#Connection">Connection</a></dt>
<dd><p>The <code>mysql</code> module&#39;s <code>Connection</code> class extended with one extra method. Returned by
  <a href="https://github.com/mysqljs/mysql#establishing-connections"><code>mysql.createConnection()</code></a>
  and <a href="https://github.com/mysqljs/mysql#pooling-connections"><code>pool.getConnection()</code></a> and
  passed to <a href="#PoolPlus..transactionHandler"><code>transactionHandler</code></a>.</p>
</dd>
<dt><a href="#MySQLTable">MySQLTable</a></dt>
<dd><p>A class that provides convenient methods for performing queries.<br>To create
an instance, use <a href="#PoolPlus+defineTable"><code>poolPlus.defineTable()</code></a> or
<a href="#PoolPlus+basicTable"><code>poolPlus.basicTable()</code></a>.</p>
</dd>
</dl>

## Info
+ [Migration Strategies](#migration-strategies)
+ [Defining Table Schemas](#defining-table-schemas)
+ [Column Types](#column-types)

---

<a name="module_mysql-plus"></a>

## mysql-plus ⇐ <code>mysql</code>
This module.

**Extends**: <code>mysql</code>
**See**: [mysql](https://github.com/mysqljs/mysql#mysql)

* [mysql-plus](#module_mysql-plus) ⇐ <code>mysql</code>
    * [~ColTypes](#module_mysql-plus..ColTypes)
    * [~KeyTypes](#module_mysql-plus..KeyTypes)
    * [~createPool(config)](#module_mysql-plus..createPool) ⇒ <code>[PoolPlus](#PoolPlus)</code>
    * [~queryCallback](#module_mysql-plus..queryCallback) : <code>function</code>


---

<a name="module_mysql-plus..ColTypes"></a>

### mysql-plus~ColTypes
A namespace that provides the column type methods used to define columns.

**See**: [Column Types](#column-types)

**Example**:
```js
const mysql = require('mysql-plus');
const pool = mysql.createPool(config);
const userTable = pool.defineTable('user', {
  columns: {
    id: mysql.ColTypes.bigint().unsigned().notNull().primaryKey(),
    created: mysql.ColTypes.datetime(),
  }
});
```


---

<a name="module_mysql-plus..KeyTypes"></a>

### mysql-plus~KeyTypes
A namespace that provides the key type methods used to define keys.

**See**: [Key Types](#key-types)

**Example**:
```js
const mysql = require('mysql-plus');
const pool = mysql.createPool(config);
const userTable = pool.defineTable('user', {
  columns: {
    id: mysql.ColTypes.bigint().unsigned().notNull().primaryKey(),
    uid: mysql.ColTypes.varchar(32).notNull(),
    created: mysql.ColTypes.datetime(),
  },
  keys: [
    mysql.KeyTypes.uniqueIndex('uid'),
    mysql.KeyTypes.index('created'),
  ],
});
```


---

<a name="module_mysql-plus..createPool"></a>

### mysql-plus~createPool(config) ⇒ <code>[PoolPlus](#PoolPlus)</code>
Just like the original [`mysql.createPool()`](https://github.com/mysqljs/mysql#pooling-connections)
method except it returns a [`PoolPlus`](#PoolPlus) instance and accepts more options.


| Param | Type | Default | Description |
|:--- |:--- |:--- |:--- |
| config | <code>Object</code> |  | A configuration object defining MySQL connection options. In addition to     the, possible [mysql connection options](https://github.com/mysqljs/mysql#connection-options),     this object may also have a `plusOptions` property to configure the [`PoolPlus`](#PoolPlus)     instance, it returns. |
| [config.plusOptions] | <code>Object</code> |  | An optional configuration object that may have the following properties: |
| [config.plusOptions.migrationStrategy] | <code>string</code> |  | One of `safe`, `alter`, or `drop`.     Please see the migration strategies documentation [here](#migration-strategies).     Defaults to `safe` in production and `alter` everywhere else. |
| [config.plusOptions.allowAlterInProduction] | <code>boolean</code> | <code>false</code> | Setting this to `true` will     allow `alter` to be used as a migration strategy in production environments. |
| [config.plusOptions.debug] | <code>boolean</code> | <code>false</code> | If set to `true`, all of the SQL operations     that will be performed will be printed to the console. |

**Returns**: <code>[PoolPlus](#PoolPlus)</code> - A new `PoolPlus` instance.

**Example**:
```js
const mysql = require('mysql-plus');
const pool = mysql.createPool({
  host: 'example.org',
  user: 'me',
  password: 'secret',
  plusOptions: {
    migrationStrategy: 'safe',
    allowAlterInProduction: true,
    debug: true,
  },
});
```


---

<a name="module_mysql-plus..queryCallback"></a>

### mysql-plus~queryCallback : <code>function</code>
A function called with the results of a query.


| Param | Type | Description |
|:--- |:--- |:--- |
| error | <code>?Error</code> | An `Error` object if an error occurred; `null` otherwise. |
| results | <code>Array</code> &#124; <code>Object</code> | The results of the query. |
| fields | <code>Array.&lt;Object&gt;</code> | Information about the returned results' fields (if any). |

**See**: [https://github.com/mysqljs/mysql#performing-queries](https://github.com/mysqljs/mysql#performing-queries)

---

<a name="PoolPlus"></a>

## PoolPlus ⇐ <code>Pool</code>
A class that extends the `mysql` module's `Pool` class with the ability to define tables
and perform queries and transactions using promises.

**Extends**: <code>Pool</code>
**See**: [Pool](https://github.com/mysqljs/mysql#pooling-connections)

* [PoolPlus](#PoolPlus) ⇐ <code>Pool</code>
    * _instance_
        * [.ColTypes](#PoolPlus+ColTypes)
        * [.KeyTypes](#PoolPlus+KeyTypes)
        * [.raw(sql)](#PoolPlus+raw) ⇒ <code>Object</code>
        * [.basicTable(name)](#PoolPlus+basicTable) ⇒ <code>[MySQLTable](#MySQLTable)</code>
        * [.defineTable(name, schema, [migrationStrategy])](#PoolPlus+defineTable) ⇒ <code>[MySQLTable](#MySQLTable)</code>
        * [.sync([cb])](#PoolPlus+sync) ⇒ <code>Promise</code>
        * [.pquery(sql, [values], [cb])](#PoolPlus+pquery) ⇒ <code>Promise</code>
        * [.transaction(trxnHandler)](#PoolPlus+transaction) ⇒ <code>Promise</code>
    * _inner_
        * [~transactionHandler](#PoolPlus..transactionHandler) ⇒ <code>Promise</code>


---

<a name="PoolPlus+ColTypes"></a>

### poolPlus.ColTypes
A namespace that provides the column type methods used to define columns.
The exact same thing as [`mysqlPlus.ColTypes`](#module_mysql-plus..ColTypes).
Just here for convenience.

**See**: [Column Types](#column-types)

**Example**:
```js
const pool = mysql.createPool(config);
const ColTypes = pool.ColTypes;
const userTable = pool.defineTable('user', {
  columns: {
    id: ColTypes.bigint().unsigned().notNull().primaryKey(),
    created: ColTypes.datetime(),
  }
});
```


---

<a name="PoolPlus+KeyTypes"></a>

### poolPlus.KeyTypes
A namespace that provides the column type methods used to define keys.
The exact same thing as [`mysqlPlus.KeyTypes`](#module_mysql-plus..KeyTypes).
Just here for convenience.

**See**: [Key Types](#key-types)

**Example**:
```js
const pool = mysql.createPool(config);
const {ColTypes, KeyTypes} = pool;
const userTable = pool.defineTable('user', {
  columns: {
    id: ColTypes.bigint().unsigned().notNull().primaryKey(),
    uid: ColTypes.varchar(32).notNull(),
    created: ColTypes.datetime(),
  },
  keys: [
    KeyTypes.uniqueIndex('uid'),
    KeyTypes.index('created'),
  ],
});
```


---

<a name="PoolPlus+raw"></a>

### poolPlus.raw(sql) ⇒ <code>Object</code>
Wraps the provided SQL string in an object that will prevent the string from being escaped
when it is used as a data-object value or `?` placeholder replacement.
(The same as [`mysql.raw()`](https://github.com/mysqljs/mysql#escaping-query-values).)


| Param | Type | Description |
|:--- |:--- |:--- |
| sql | <code>string</code> | SQL that should not be escaped. |

**Returns**: <code>Object</code> - An object that is turned into the provided `sql` string when `mysql` attempts to escape it.
**See**: [(mysql) Escaping query values](https://github.com/mysqljs/mysql#escaping-query-values)

**Example**: Inserting a geometry Point
```js
placeTable.insert({
  placeId: 'ChIJK2f',
  coordinates: pool.raw('POINT(-80.5204, 43.4642)'),
});
// or
placeTable.insert(
  'SET `placeId` = ?, `coordinates` = ?',
  ['ChIJK2f', pool.raw('POINT(-80.5204, 43.4642)')]
);

// INSERT INTO `place`
// SET `placeId` = 'ChIJK2f', `coordinates` = POINT(-80.5204, 43.4642);
```


---

<a name="PoolPlus+basicTable"></a>

### poolPlus.basicTable(name) ⇒ <code>[MySQLTable](#MySQLTable)</code>
Simply returns an instance of [`MySQLTable`](#MySQLTable)
for querying the table with the given `name`.


| Param | Type | Description |
|:--- |:--- |:--- |
| name | <code>string</code> | The name of the table. |

**Returns**: <code>[MySQLTable](#MySQLTable)</code> - A `MySQLTable` instance.

---

<a name="PoolPlus+defineTable"></a>

### poolPlus.defineTable(name, schema, [migrationStrategy]) ⇒ <code>[MySQLTable](#MySQLTable)</code>
Defines a table to be created or updated in the database.


| Param | Type | Description |
|:--- |:--- |:--- |
| name | <code>string</code> | The name of the table. |
| schema | <code>Object</code> | An object that defines the table's schema.     See the [Defining Table Schemas](#defining-table-schemas) section. |
| [migrationStrategy] | <code>string</code> | One of `safe`, `alter`, or `drop`. This will override     the `migrationStrategy` value from the [`config`](#module_mysql-plus..createPool)     (but is still subject to the same restrictions in production environments). |

**Returns**: <code>[MySQLTable](#MySQLTable)</code> - A `MySQLTable` instance that has methods for performing queries on the table.
**See**: [Defining Table Schemas](#defining-table-schemas)

**Example**:
```js
const userTable = pool.defineTable('user', {
  columns: {
    id: pool.ColTypes.bigint().unsigned().notNull().primaryKey().autoIncrement(),
    email: pool.ColTypes.varchar(255).notNull().unique(),
    created: pool.ColTypes.datetime(),
  }
});
```


---

<a name="PoolPlus+sync"></a>

### poolPlus.sync([cb]) ⇒ <code>Promise</code>
Syncs the defined tables to the database by creating new tables and dropping
or migrating existing tables (depending on the migration setting).

Generally, this should only be called once when starting up a server.

__Warning:__ If an error occurs while syncing, the database will be in an unknown state.
Always keep a backup of your database so you can restore it to the latest working state.


| Param | Type | Description |
|:--- |:--- |:--- |
| [cb] | <code>function</code> | A callback that is called once all defined table schemas have been synced to the     database. If an error occured, the first argument passed to the callback will be the error object. |

**Returns**: <code>?Promise</code> - If `cb` is not provided, a promise will be returned.

**Example**: With a callback
```js
pool.sync((err) => {
  if (err) throw err;
  // Now do something such as start an HTTP server
});
```

**Example**: With a promise
```js
pool.sync()
  .then(() => {
    // Success
  }, (err) => {
    // Error
  });
```


---

<a name="PoolPlus+pquery"></a>

### poolPlus.pquery(sql, [values], [cb]) ⇒ <code>Promise</code>
The same as the `query` method on the original mysql `Pool` except when not passed a
callback it returns a promise that resolves with the results of the query.


| Param | Type | Description |
|:--- |:--- |:--- |
| sql | <code>string</code> &#124; <code>Object</code> | An SqlString or options object. |
| [values] | <code>Array</code> | Values to replace placeholders in the SqlString. |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | An optional callback that gets called with     the results of the query. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will resolve with the results
    of the query is returned.
**See**: [https://github.com/mysqljs/mysql#performing-queries](https://github.com/mysqljs/mysql#performing-queries)

**Example**:
```js
pool.pquery('SELECT * FROM `books` WHERE `author` = "David"')
  .then((results) => {
    // results will contain the results of the query
  })
  .catch((error) => {
    // error will be the Error that occurred during the query
  });
```


---

<a name="PoolPlus+transaction"></a>

### poolPlus.transaction(trxnHandler) ⇒ <code>Promise</code>
Begins a transaction and provides a connection to use to make queries during the transaction.

__Note:__ Be aware that there are commands in MySQL that can cause an implicit commit, as described
in [the MySQL documentation](http://dev.mysql.com/doc/refman/5.5/en/implicit-commit.html).


| Param | Type | Description |
|:--- |:--- |:--- |
| trxnHandler | <code>[transactionHandler](#PoolPlus..transactionHandler)</code> | A function that, given a transaction connection,     will make queries and then end the transaction. |

**Returns**: <code>Promise</code> - A promise that is resolved with the results of the transaction (the value
    passed to the `done()` callback or the result of the last returned promise) or is
    rejected with the error that caused the transaction to fail.

**Example**: Using the `done` callback
```js
pool.transaction((trxn, done) => {
  trxn.query('INSERT INTO `animals` VALUES ("dog")', (err, result) => {
    if (err) return done(err);
    trxn.query(
      'INSERT INTO `pets` (`type`,`name`) VALUES (?, "Rover")',
      [result.insertId],
      done
    );
  });
}).then(result => {
  // result is the result of inserting "Rover" into `pets`
}).catch(err => {
  // If this is called then the inserts will have been rolled back
  // (so "dog" will not be in the `animals` table)
});
```

**Example**: Returning a promise
```js
pool.transaction((trxn) => {
  return trxn.pquery('INSERT INTO `animals` (`type`) VALUES ("dog")')
    .then(result => trxn.pquery(
      'INSERT INTO `pets` (`typeID`,`name`) VALUES (?, "Rover")',
      [result.insertId]
    ));
}).then(result => {
  // result is the result of inserting "Rover" into `pets`
}).catch(err => {
  // An error occurred and the inserts have been rolled back
});
```


---

<a name="PoolPlus..transactionHandler"></a>

### PoolPlus~transactionHandler ⇒ <code>Promise</code>
A function that will make queries during a transaction.


| Param | Type | Description |
|:--- |:--- |:--- |
| trxn | <code>[Connection](#Connection)</code> | The transaction connection. |
| [done] | <code>function</code> | A callback that can be used to end the transaction. |

**Returns**: <code>?Promise</code> - If not using the `done` callback, this function must return a promise.
    If the promise resolves, the transaction will be committed, and if it rejects, the
    transaction will be rolled back. If this function does not return a promise, the
    `done` callback must be used or else the transaction will not be committed and
    the transaction connection will never be released.
**See**: [`poolPlus.transaction()`](#PoolPlus+transaction)

**Example**: To fail a transaction using the `done` callback
```js
// Call the `done` callback with a truthy value as the first argument
done(error);
```

**Example**: To complete a transaction using the `done` callback
```js
// Call the `done` callback with a falsy value as the first argument
// and pass the results of the transaction as the second argument
done(null, results);
done(); // Passing results is not required
```

**Example**: Full example using the `done` callback
```js
function trxnHandler(trxn, done) {
  trxn.query('INSERT INTO `animals` (`type`) VALUES ("dog")', (err, animalsResult) => {
    if (err) return done(err);
    trxn.query(
      'INSERT INTO `pets` (`typeID`,`name`) VALUES (?, "Rover")',
      [animalsResult.insertId],
      (err, petsResult) => {
        if (err) return done(err);
        done(null, {animalsResult, petsResult});
      }
    );
  });
}
```


---

<a name="Connection"></a>

## Connection
The `mysql` module's `Connection` class extended with one extra method. Returned by
  [`mysql.createConnection()`](https://github.com/mysqljs/mysql#establishing-connections)
  and [`pool.getConnection()`](https://github.com/mysqljs/mysql#pooling-connections) and
  passed to [`transactionHandler`](#PoolPlus..transactionHandler).


---

<a name="Connection+pquery"></a>

### connection.pquery(sql, [values], [cb]) ⇒ <code>Promise</code>
The same as the `query` method except when not passed a callback it returns
a promise that resolves with the results of the query.


| Param | Type | Description |
|:--- |:--- |:--- |
| sql | <code>string</code> &#124; <code>Object</code> | An SqlString or options object. |
| [values] | <code>Array</code> | Values to replace placeholders in the SqlString. |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | An optional callback that gets called with     the results of the query. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will resolve with the results
    of the query is returned.
**See**: [https://github.com/mysqljs/mysql#performing-queries](https://github.com/mysqljs/mysql#performing-queries)

**Example**:
```js
connection.pquery('SELECT * FROM `books` WHERE `author` = "David"')
  .then((results) => {
    // results will contain the results of the query
  })
  .catch((error) => {
    // error will be the Error that occurred during the query
  });
```


---

<a name="MySQLTable"></a>

## MySQLTable
A class that provides convenient methods for performing queries.<br>To create
an instance, use [`poolPlus.defineTable()`](#PoolPlus+defineTable) or
[`poolPlus.basicTable()`](#PoolPlus+basicTable).

**See**: [https://github.com/mysqljs/mysql#performing-queries](https://github.com/mysqljs/mysql#performing-queries)

* [MySQLTable](#MySQLTable)
    * [.name](#MySQLTable+name) : <code>string</code>
    * [.schema](#MySQLTable+schema) : <code>Object</code>
    * [.pool](#MySQLTable+pool) : <code>[PoolPlus](#PoolPlus)</code>
    * [.trxn](#MySQLTable+trxn) : <code>?[Connection](#Connection)</code>
    * [.select(columns, [sqlString], [values], [cb])](#MySQLTable+select) ⇒ <code>Promise</code>
    * [.exists(sqlString, [values], [cb])](#MySQLTable+exists) ⇒ <code>Promise</code>
    * [.insert([data], [sqlString], [values], [cb])](#MySQLTable+insert) ⇒ <code>Promise</code>
    * [.insertIfNotExists(data, keyColumns, [cb])](#MySQLTable+insertIfNotExists) ⇒ <code>Promise</code>
    * [.update([data], [sqlString], [values], [cb])](#MySQLTable+update) ⇒ <code>Promise</code>
    * [.delete([sqlString], [values], [cb])](#MySQLTable+delete) ⇒ <code>Promise</code>
    * [.query()](#MySQLTable+query) ⇒ <code>Promise</code>
    * [.transacting(trxn)](#MySQLTable+transacting) ⇒ <code>[MySQLTable](#MySQLTable)</code>


---

<a name="MySQLTable+name"></a>

### mySQLTable.name : <code>string</code>
The table's name (as passed to [`poolPlus.defineTable()`](#PoolPlus+defineTable)).


---

<a name="MySQLTable+schema"></a>

### mySQLTable.schema : <code>Object</code>
The table's schema (as passed to [`poolPlus.defineTable()`](#PoolPlus+defineTable)).


---

<a name="MySQLTable+pool"></a>

### mySQLTable.pool : <code>[PoolPlus](#PoolPlus)</code>
The `PoolPlus` instance that created this table.


---

<a name="MySQLTable+trxn"></a>

### mySQLTable.trxn : <code>?[Connection](#Connection)</code>
The transaction connection that created this table from a call
to [`table.transacting(trxn)`](#MySQLTable+transacting).


---

<a name="MySQLTable+select"></a>

### mySQLTable.select(columns, [sqlString], [values], [cb]) ⇒ <code>Promise</code>
Selects data from the table.


| Param | Type | Description |
|:--- |:--- |:--- |
| columns | <code>Array.&lt;string&gt;</code> &#124; <code>string</code> | An array of columns to select or a custom `SELECT` string. |
| [sqlString] | <code>string</code> | SQL to be appended to the query after the `FROM table` clause. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString` and `columns`. |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will resolve with the results
    of the query is returned.

**Example**: Select all columns
```js
userTable.select('*', (err, rows) => {
  if (err) throw err;
  // rows contains all data for all users
});

// SELECT * FROM `user`;
```

**Example**: Select specific columns
```js
userTable.select(['email', 'name'], 'WHERE `points` > 10000', (err, rows) => {
  if (err) throw err;
  console.log(rows); // -> [{email: 'email@example.com', name: 'John Doe'}, ...]
});

// SELECT `email`, `name` FROM `user` WHERE `points` > 10000;
```

**Example**: Select with placeholders
```js
userTable.select(['email'], 'WHERE `id` = ?', [5])
  .then(rows => console.log(rows)); // -> [{email: 'email@example.com'}]

// SELECT `email` FROM `user` WHERE `id` = 5;


userTable.select('??', 'WHERE ?', ['email', {id: 5}])
  .then(rows => console.log(rows)); // -> [{email: 'email@example.com'}]

// SELECT `email` FROM `user` WHERE `id` = 5;
```

**Example**: Select columns with aliases
```js
userTable.select('`name` AS `fullName`', 'WHERE `points` > 10000')
  .then(rows => console.log(rows)); // -> [{fullName: 'John Doe'}, ...]

// SELECT `name` AS `fullName` FROM `user` WHERE `points` > 10000;
```

**Example**: Select using a function
```js
userTable.select('COUNT(*) AS `highScorers`', 'WHERE `points` > 10000')
  .then(rows => console.log(rows)); // -> [{highScorers: 27}]

// SELECT COUNT(*) AS `highScorers` FROM `user` WHERE `points` > 10000;
```


---

<a name="MySQLTable+exists"></a>

### mySQLTable.exists(sqlString, [values], [cb]) ⇒ <code>Promise</code>
Checks if rows in the table exist.


| Param | Type | Description |
|:--- |:--- |:--- |
| sqlString | <code>string</code> | SQL that specifies rows to check for existence.<br>     The first example shows how this parameter is used in the query. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString`. |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with     the results of the query where the `results` will be either `true` or `false`. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will
    resolve with either `true` or `false` is returned.

**Example**: Using a promise
```js
userTable.exists('WHERE `id` > 10')
  .then(exists => console.log(exists)); // true or false

// SELECT EXISTS (
//   SELECT 1 FROM `user`
//   WHERE `id` > 10  # This is where `sqlString` gets inserted
//   LIMIT 1
// )
```

**Example**: Using a callback and the `values` argument
```js
userTable.exists('WHERE `id` = ?', [10], (err, exists) => {
  if (err) throw err;
  console.log(exists); // true or false
});
```


---

<a name="MySQLTable+insert"></a>

### mySQLTable.insert([data], [sqlString], [values], [cb]) ⇒ <code>Promise</code>
Inserts data into a new row in the table.

__Note:__ The `data` and `sqlString` arguments are individually
optional but at least one of them must be specified.


| Param | Type | Description |
|:--- |:--- |:--- |
| [data] | <code>Object</code> &#124; <code>Array</code> | An object of (column name)-(data value) pairs or     an array containing either 1) an array of arrays of data values or 2) an array     of column names and the data array from 1). |
| [sqlString] | <code>string</code> | SQL to be appended to the query. If `data` is provided, it is appended     directly after the formatted data, otherwise it is appended after `"INSERT INTO tableName"`. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString`. |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will resolve with the results
    of the query is returned.

**Example**: Insert a new user
```js
userTable.insert({email: 'email@example.com', name: 'John Doe'})
  .then(result => result.affectedRows); // 1

// INSERT INTO `user`
// SET `email` = 'email@example.com', `name` = 'John Doe';
```

**Example**: Insert or update
```js
const data = {id: 5, points: 100};
// If duplicate key (id), add the points
const onDuplicateKeySQL = 'ON DUPLICATE KEY UPDATE `points` = `points` + ?';
userTable.insert(data, onDuplicateKeySQL, [data.points])
  .then(result => result.affectedRows); // 1 if inserted, 2 if updated

// INSERT INTO `user` SET `id` = 5, `points` = 100
// ON DUPLICATE KEY UPDATE `points` = `points` + 100;
```

**Example**: With only the `sqlString` argument
```js
placeTable.insert('SET `location` = POINT(0, 0)');
// INSERT INTO `place` SET `location` = POINT(0, 0);

placeTable.insert('(`location`) VALUES (POINT(?, ?))', [8, 2]);
// INSERT INTO `place` (`location`) VALUES (POINT(8, 2));
```

**Example**: Bulk insert
```js
const users = [
  [1, 'john@email.com', 'John Doe'],
  [2, 'jane@email.com', 'Jane Brown'],
];
userTable.insert([users])
  .then(result => result.insertId); // 2 (ID of the last inserted row)

// INSERT INTO `user` VALUES
// (1, 'john@email.com', 'John Doe'),
// (2, 'jane@email.com', 'Jane Brown');
```

**Example**: Bulk insert with specified columns
```js
const users = [
  ['john@email.com', 'John Doe'],
  ['jane@email.com', 'Jane Brown'],
];
userTable.insert([['email', 'name'], users])
  .then(result => result.affectedRows); // 2

// INSERT INTO `user` (`email`, `name`) VALUES
// ('john@email.com', 'John Doe'),
// ('jane@email.com', 'Jane Brown');
```


---

<a name="MySQLTable+insertIfNotExists"></a>

### mySQLTable.insertIfNotExists(data, keyColumns, [cb]) ⇒ <code>Promise</code>
Inserts a new row into the table if there are no existing rows in
the table that have the same values for the specified columns.

This is useful because if the row is not inserted, the table's
`AUTO_INCREMENT` value is not increased (unlike when an insert
fails because of a unique key constraint).


| Param | Type | Description |
|:--- |:--- |:--- |
| data | <code>Object</code> | An object mapping column names to data values to insert. |
| keyColumns | <code>Array.&lt;string&gt;</code> | The names of columns in the `data` object.     If there is already a row in the table with the same values for these     columns as the values being inserted, the data will not be inserted. |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will
    resolve with the results of the query is returned.

**Example**: Insert a new user if a user with the same email does not exist
```js
userTable.insertIfNotExists({email: 'email@example.com', name: 'John Doe'}, ['email'])
  .then(result => result.affectedRows);
  // 0 - If there was a row with `email` = 'email@example.com' (row not inserted)
  // 1 - If there wasn't (row was inserted)

// INSERT INTO `user` (`email`, `name`)
// SELECT 'email@example.com', 'John Doe'
// FROM DUAL WHERE NOT EXISTS (
//   SELECT 1 FROM `user`
//   WHERE `email` = 'email@example.com' LIMIT 1
// );
```

**Example**: Insert without escaping some values
```js
const data = {
  placeId: 'ChIJK2f-X1bxK4gRkB0jxyh7AwU',
  type: 'city',
  location: mysql.raw('POINT(-80.5204096, 43.4642578)'),
};
placeTable.insertIfNotExists(data, ['placeId', 'type'])
  .then(result => result.affectedRows);
  // 0 - If there was a row with the same `placeId` and `type` (row not inserted)
  // 1 - If there wasn't (row was inserted)

// INSERT INTO `place` (`placeId`, `type`, `location`)
// SELECT 'ChIJK2f-X1bxK4gRkB0jxyh7AwU', 'city', POINT(-80.5204096, 43.4642578)
// FROM DUAL WHERE NOT EXISTS (
//   SELECT 1 FROM `place`
//   WHERE `placeId` = 'ChIJK2f-X1bxK4gRkB0jxyh7AwU' AND `type` = 'city' LIMIT 1
// );
```


---

<a name="MySQLTable+update"></a>

### mySQLTable.update([data], [sqlString], [values], [cb]) ⇒ <code>Promise</code>
Updates data in the table.

__Note:__ The `data` and `sqlString` arguments are individually
optional but at least one of them must be specified.


| Param | Type | Description |
|:--- |:--- |:--- |
| [data] | <code>Object</code> | An object of (column name)-(data value) pairs that define the new column values. |
| [sqlString] | <code>string</code> | SQL to be appended to the query after the `SET data` clause     or immediately after `SET ` if `data` is omitted. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString` (and/or `data`). |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will resolve with the results
    of the query is returned.

**Example**: With both the `data` and `sqlString` arguments
```js
userTable.update({email: 'updated@email.com'}, 'WHERE `id` = ?', [5])
  .then(result => result.changedRows); // 1

// UPDATE `user` SET `email` = 'updated@email.com'
// WHERE `id` = 5;
```

**Example**: With only the `sqlString` argument
```js
userTable.update("`word` = CONCAT('prefix', `word`)");
// UPDATE `user` SET `word` = CONCAT('prefix', `word`);

userTable.update('`points` = `points` + ? WHERE `winner` = ?', [10, 1]);
// UPDATE `user` SET `points` = `points` + 10
// WHERE `winner` = 1;
```

**Example**: With only the `data` argument (updates all rows)
```js
userTable.update({points: 1000});
// UPDATE `user` SET `points` = 1000;

userTable.update({points: mysql.raw('`points` + 10')});
// UPDATE `user` SET `points` = `points` + 10;
```


---

<a name="MySQLTable+delete"></a>

### mySQLTable.delete([sqlString], [values], [cb]) ⇒ <code>Promise</code>
Deletes data from the table.


| Param | Type | Description |
|:--- |:--- |:--- |
| [sqlString] | <code>string</code> | SQL to be appended to the query after the `FROM table` clause. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString`. |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will resolve with the results
    of the query is returned.

**Example**: Delete specific rows
```js
userTable.delete('WHERE `spammer` = 1')
  .then(result => result.affectedRows); // The number of deleted spammers

// DELETE FROM `user` WHERE `spammer` = 1;
```

**Example**: Delete all rows (you probably don't want to do this)
```js
userTable.delete((err, result) => {
  if (err) throw err;
  // all rows deleted :(
});

// DELETE FROM `user`;
```


---

<a name="MySQLTable+query"></a>

### mySQLTable.query() ⇒ <code>Promise</code>
Exactly the same as [`pool.pquery()`](#PoolPlus+pquery).


---

<a name="MySQLTable+transacting"></a>

### mySQLTable.transacting(trxn) ⇒ <code>[MySQLTable](#MySQLTable)</code>
Returns a new `MySQLTable` instance that will perform queries using the provided transaction connection.


| Param | Type | Description |
|:--- |:--- |:--- |
| trxn | <code>[Connection](#Connection)</code> | The transaction connection that will be used to perform queries. |

**Returns**: <code>[MySQLTable](#MySQLTable)</code> - A new `MySQLTable` instance that will perform queries using the provided transaction
    connection instead of the `PoolPlus` instance that was used to create the original instance.
**See**: [`pool.transaction()`](#PoolPlus+transaction)

**Example**:
```js
const animalsTable = pool.defineTable('animals', schema);
const petsTable = pool.defineTable('pets', schema);

pool.transaction((trxn) => {
  return animalsTable.transacting(trxn)
    .insert({type: 'dog'})
    .then(result =>
      petsTable.transacting(trxn)
        .insert({typeID: result.insertId, name: 'Rover'})
    );
}).then(result => {
  // result is the result of inserting "Rover" into the pets table
}).catch(err => {
  // An error occurred during the transaction
});
```


---


## Migration Strategies

The possible migration strategies are as follows:

+ `safe` - default in a production environment (`NODE_ENV === 'production'`)
+ `alter` - default in a development environment
+ `drop`

In addition to being the default in a production environment, the `safe` strategy is the only allowed strategy in production. This means that if `alter` or `drop` are used anywhere to configure connections or tables, they will be ignored and `safe` will be used instead. However, it is possible to override this behavior to allow the `alter` strategy in production by setting the `allowAlterInProduction` option to `true` in the [Pool configuration](#mysql-pluscreatepoolconfig--poolplus).

### safe

Only allows newly-defined tables to be created. Existing tables are never changed in any way.

### alter

Specifies that newly-defined tables will be created, existing tables that are no longer defined will be dropped, and existing tables that have a different definition from what is found in the database will be migrated with minimal data-loss.

**To rename table columns**, the column's old name must be specified in the [column definition](#columndefinition) with the `.oldName('name')` method. If it is not, the column will be dropped and all of the data that was in that column will be lost.

**Note:** It is up to you to understand how changes to an existing table might affect the data. For example, changing a DOUBLE column to a FLOAT will cause the precision of the value to be reduced so some significant digits may be lost (i.e. `1.123456789` would be reduced to `1.12346`). Furthermore, some changes to tables cannot be done and will cause an error. An example of this would be adding a column with the `NOT NULL` attribute to a non-empty table without specifying a default value.

##### Known Migrations That Will Not Work

+ Altering a column in a certain way when a different table references that column as a foreign key.
  + Normally this isn't a problem if the column type is being changed (since you'd also need to change the column type in the referencing table and `mysql-plus` can handle this case), but if only the column in the first table needs to change (such as modifying it's `AUTO_INCREMENT` value), the operation will fail because of the foreign key constraint.
  + **Workaround 1:** Manually remove the foreign key constraint from the referencing table (using SQL) before syncing.
  + **Workaround 2:** Remove the foreign key definition from the referencing table schema (i.e. by commenting it out) before syncing the column change, then restore the foreign key definition and re-sync.

### drop

All defined tables will be dropped and recreated.


## Defining Table Schemas

A schema is defined by a JavaScript object with certain properties. For `mysql-plus`, the schema properties can be broken down into four main types:

+ [Columns](#columns)
+ [Primary Key](#primary-key)
+ [Keys](#keys)
+ [Table Options](#table-options)

### Columns

Columns are defined using the `column` property which is an object where the keys are column names and the values are [column definitions](#columndefinition) of a certain [type](#column-types).

**Example:**
```js
{
  columns: {
    id: pool.ColTypes.bigint().unsigned().notNull().primaryKey().autoIncrement(),
    email: pool.ColTypes.varchar(255).notNull().unique(),
    points: pool.ColTypes.int().unsigned().default(0),
  }
}
```

See the [Column Types](#column-types) section for all possible column types and attributes that can be defined.

### Primary Key

`string | string[]`

The table’s primary key can be defined with the `primaryKey` property.

```js
{
  columns: {
    id: pool.ColTypes.int().unsigned().notNull(),
    name: pool.ColTypes.varchar(255).notNull(),
  },
  primaryKey: 'id'
}
```

An array can be used to define a multi-column primary key.

```js
{
  columns: {
    id: pool.ColTypes.int().unsigned().notNull(),
    name: pool.ColTypes.varchar(255).notNull(),
  },
  primaryKey: ['id', 'name']
}
```

Primary keys for string columns may include a key [prefix length](#prefix-lengths).

```js
{
  columns: {
    id: pool.ColTypes.varchar(100).unsigned().notNull(),
  },
  primaryKey: 'id(20)'
}
```

### Keys

Keys can be defined with the `keys` property, which is an array of [`KeyTypes`](#key-types):

```js
{
  columns: {
    id: pool.ColTypes.int().unsigned().notNull(),
    accountID: pool.ColTypes.int().unsigned().notNull(),
    email: pool.ColTypes.varchar(255).notNull(),
    location: pool.ColTypes.point().notNull(),
    description: pool.ColTypes.text(),
  },
  keys: [
    pool.KeyTypes.index('accountID'),
    pool.KeyTypes.uniqueIndex('email'),
    pool.KeyTypes.spatialIndex('location'),
    pool.KeyTypes.fulltextIndex('description'),
    pool.KeyTypes.foreignKey('accountID').references('account', 'id'),
  ]
}
```

See the [Key Types](#key-types) section for information on the different types of keys that can be defined.

### Table Options

These schema properties configure table-level options. The options currently supported are as follows:

+ `engine` - Specify the storage engine for the table (such as InnoDB or MyISAM)
+ `autoIncrement` - The initial `AUTO_INCREMENT` value for the table
+ `charset` - Specify a default character set for the table
+ `collate` - Specify a default collation for the table
+ `compression` - The compression algorithm used for page level compression (MySQL 5.7 + InnoDB only)
+ `rowFormat` - Defines the physical format in which the rows are stored

**Example:**
```js
{
  columns: {...},
  engine: 'MyISAM',
  autoIncrement: 5000000000
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_520_ci',
  compression: 'LZ4',
  rowFormat: 'COMPACT',
}
```

**Note:** After explicitly defining a table option in a schema, if you remove it from the schema and resync your table definitions, the table option will not change in the database. To go back to the default value for the table option, you'll need to explicitly define it on the schema and resync the table (or manually change it on the command line), and then you may remove it from the schema.

## Column Types

+ [ColumnDefinition](#columndefinition)
  + [NumericColumnDefinition](#numericcolumndefinition)
  + [TextColumnDefinition](#textcolumndefinition)
  + [UpdatableTimeColumnDefinition](#updatabletimecolumndefinition)
    + [TimestampColumnDefinition](#timestampcolumndefinition)
  + [GeometryColumnDefinition](#geometrycolumndefinition)

[`mysql.ColTypes`](#module_mysql-plus..ColTypes) and [`pool.ColTypes`](#PoolPlus+ColTypes) both expose the following methods:

+ `tinyint([m])`
+ `smallint([m])`
+ `mediumint([m])`
+ `int([m])`
+ `integer([m])` - synonym for `int`
+ `bigint([m])`
+ `float([m [, d]])`
+ `double([m [, d]])`
+ `decimal([m [, d]])`
+ `dec([m [, d]])` - synonym for `decimal`
+ `numeric([m [, d]])` - synonym for `decimal`
+ `fixed([m [, d]])` - synonym for `decimal`
+ `bit([m])`
+ `bool()` - synonym for `tinyint(1)`
+ `boolean()` - synonym for `tinyint(1)`
+ `date()`
+ `datetime([m])`
+ `timestamp([m])`
+ `time([m])`
+ `year()`
+ `char([m])`
+ `varchar(m)`
+ `text([m])`
+ `tinytext()`
+ `mediumtext()`
+ `longtext()`
+ `binary([m])`
+ `varbinary(m)`
+ `blob([m])`
+ `tinyblob()`
+ `mediumblob()`
+ `longblob()`
+ `enum(...values)`
+ `set(...values)`
+ `json()`
+ `geometry()`
+ `point()`
+ `linestring()`
+ `polygon()`
+ `multipoint()`
+ `multilinestring()`
+ `multipolygon()`
+ `geometrycollection()`

All of these methods return a `ColumnDefinition` class.

#### ColumnDefinition

This class is what is used to define the column's attributes. These attributes can be set using the following methods:

+ `notNull()` - Adds the `NOT NULL` attribute
+ `default(value)` - Sets the column's `DEFAULT` value
  + Examples:
    + `.default('Hello')` produces `DEFAULT 'Hello'`
    + `.default(null)` produces `DEFAULT NULL`
  + __Note:__ `*blob`, `*text`, `json`, and geometry columns cannot be assigned a default value other than `null`.
+ `primaryKey()` - Declares the column to be the table's primary key
+ `unique()` - Creates a unique index for the column
+ `index()` - Creates an index for the column
+ `oldName(name: string)` - The previous/current column name. If a column with this name exists, it will be renamed to the column name associated with the column defintion so that the data in that column will not be lost.

All `ColumnDefinition` methods return the `ColumnDefinition`, so they are chainable.

Additionally, certain column types have type-specific methods. These are as follows:

#### NumericColumnDefinition

Methods:

+ `unsigned()` - Adds the `unsigned` attribute
+ `zerofill()` - Adds the `zerofill` attribute
+ `autoIncrement()` - Adds the `AUTO_INCREMENT` attribute

Compatible types:

+ `tinyint`
+ `smallint`
+ `mediumint`
+ `int`
+ `integer`
+ `bigint`
+ `float`
+ `double`
+ `decimal`
+ `dec`
+ `numeric`
+ `fixed`

#### TextColumnDefinition

Methods:

+ `charset(value)` - Sets the column's character set
+ `collate(value)` - Sets the column's collation
+ `fulltextIndex()` - Creates a [fulltext index](https://dev.mysql.com/doc/en/innodb-fulltext-index.html) for the column (excluding `enum` and `set` columns)

Compatible types:

+ `char`
+ `varchar`
+ `text`
+ `tinytext`
+ `mediumtext`
+ `longtext`
+ `enum`
+ `set`

#### UpdatableTimeColumnDefinition

Methods:

+ `defaultCurrentTimestamp()` - Adds the `DEFAULT CURRENT_TIMESTAMP` attribute
+ `onUpdateCurrentTimestamp()` - Adds the `ON UPDATE CURRENT_TIMESTAMP` attribute

Compatible types:

+ `datetime`
+ `timestamp`

#### TimestampColumnDefinition

Compatible types:

+ `timestamp`

There aren't any extra methods on this type, but there are some things to be aware of with `timestamp` columns:

##### NULL Timestamps

Normally, timestamp columns are `NOT NULL` by default, however, mysql-plus defines timestamp columns to be `NULL` by default to keep column definition semantics consistent. Therefore, the following column definition:

```js
{
  ts: ColTypes.timestamp(),
}
```

would define a column with this SQL:

```sql
`ts` timestamp NULL DEFAULT NULL
```

##### Timestamps' DEFAULT value

If a timestamp column is defined with the `notNull()` method, the column's `DEFAULT` value will be set to `CURRENT_TIMESTAMP`. So the following:

```js
{
  ts: ColTypes.timestamp().notNull(), // equivalent to `ColTypes.timestamp().notNull().defaultCurrentTimestamp()`
}
```

would define a column with this SQL:

```sql
`ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Normally if the `DEFAULT` is unspecified, MySQL uses `CURRENT_TIMESTAMP` as the `DEFAULT` value of only the first timestamp column and `'0000-00-00 00:00:00'` for subsequent columns, but `mysql-plus` uses `CURRENT_TIMESTAMP` for all timestamp columns for consistency.

#### GeometryColumnDefinition

Methods:

+ `spatialIndex()` - Creates a [spatial index](https://dev.mysql.com/doc/en/create-index.html#create-index-spatial) for the column

Compatible types:

+ `geometry`
+ `point`
+ `linestring`
+ `polygon`
+ `multipoint`
+ `multilinestring`
+ `multipolygon`
+ `geometrycollection`

## Key Types

[`mysql.KeyTypes`](#module_mysql-plus..KeyTypes) and [`pool.KeyTypes`](#PoolPlus+KeyTypes) both expose the following methods for defining table keys:

+ `index(keyPart [, ...otherKeyParts])` - Creates a regular [index](https://dev.mysql.com/doc/en/create-index.html)
+ `uniqueIndex(keyPart [, ...otherKeyParts])` - Creates a [unique index](https://dev.mysql.com/doc/en/create-index.html#create-index-unique)
+ `spatialIndex(columnName)` - Creates a [spatial index](https://dev.mysql.com/doc/en/create-index.html#create-index-spatial)
+ `fulltextIndex(columnName, [...otherColumns])` - Creates a [fulltext index](https://dev.mysql.com/doc/en/innodb-fulltext-index.html)
+ `foreignKey(columnName [, ...otherColumns])` - Creates a [foreign key constraint](https://dev.mysql.com/doc/en/create-table-foreign-keys.html)

**Example:**
```js
{
  keys: [
    pool.KeyTypes.index('accountID'),
    pool.KeyTypes.uniqueIndex('email'),
    pool.KeyTypes.spatialIndex('location'),
    pool.KeyTypes.fulltextIndex('description'),
    pool.KeyTypes.foreignKey('accountID').references('account', 'id'),

    // Multi-column keys
    pool.KeyTypes.uniqueIndex('accountID', 'email'),
    pool.KeyTypes.foreignKey('userID', 'accountID').references('user', ['id', 'accountID']),
  ]
}
```

All key types have a `name` method that can be used to customize the key’s name (helpful if you need to use an [index hint](https://dev.mysql.com/doc/en/index-hints.html) in a query):

```js
{
  keys: [
    pool.KeyTypes.index('accountID').name('account_key'),
    pool.KeyTypes.uniqueIndex('email').name('email_key'),
    pool.KeyTypes.spatialIndex('location').name('location_key'),
    pool.KeyTypes.fulltextIndex('description').name('description_key'),
    pool.KeyTypes.foreignKey('accountID').references('account', 'id').name('account_foreign_key'),
  ]
}
```

### Foreign Keys

Foreign keys have the following additional methods:

+ `references(tableName, columns)` - Sets the name of the reference table (`string`) and the referenced columns (`string|Array<string>`)
+ `onDelete(action)` - Sets the foreign key’s `ON DELETE` action, where `action` is one of: `RESTRICT`, `CASCADE`, `SET NULL`, `NO ACTION`
+ `onUpdate(action)` - Sets the foreign key’s `ON UPDATE` action (with the same options as `onDelete`)
+ `cascade()` - Short for: `.onDelete('CASCADE').onUpdate('CASCADE')`

**Example:**
```js
{
  columns: {
    id: /* ... */,
    uid: /* ... */,
    userID: /* ... */,
    thingOne: /* ... */,
    thingTwo: /* ... */,
  },
  keys: [
    KeyTypes.foreignKey('id').references('other_table', 'id'),
    KeyTypes.foreignKey('uid').references('other_table', 'uid').cascade(),
    KeyTypes.foreignKey('userID').references('user', 'id').onDelete('CASCADE').onUpdate('SET NULL'),
    KeyTypes.foreignKey('thingOne', 'thingTwo').references('thing_table', ['one', 'two']),
  ]
}
```

**Note:** Foreign keys don't define indexes, but [_constraints_](https://dev.mysql.com/doc/en/glossary.html#glos_foreign_key_constraint). When defining foreign keys, the columns used in the key should also have an index.

Indexes required for the example above:

```js
{
  primaryKey: 'id',
  keys: [
    KeyTypes.uniqueIndex('uid'),
    KeyTypes.uniqueIndex('userID'),
    KeyTypes.index('thingOne', 'thingTwo'),
  ]
}
```

### Prefix Lengths

`PRIMARY`, `INDEX`, and `UNIQUE` keys on `char`, `varchar`, `binary`, `varbinary`, `blob`, and `text` columns may include a [key prefix length](https://dev.mysql.com/doc/en/create-index.html#create-index-column-prefixes).

```js
{
  columns: {
    id: ColTypes.char(50).notNull(),
    uid: ColTypes.varchar(100).notNull(),
    description: ColTypes.text(),
  },
  primaryKey: 'id(10)',
  keys: [
    KeyTypes.uniqueIndex('uid(30)'),
    KeyTypes.index('description(50)'),
  ]
```
