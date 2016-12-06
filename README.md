# mysql-plus

[![NPM Version](https://img.shields.io/npm/v/mysql-plus.svg)](https://www.npmjs.com/package/mysql-plus)
[![Build Status](https://travis-ci.org/nwoltman/node-mysql-plus.svg?branch=master)](https://travis-ci.org/nwoltman/node-mysql-plus)
[![Coverage Status](https://coveralls.io/repos/github/nwoltman/node-mysql-plus/badge.svg?branch=master)](https://coveralls.io/github/nwoltman/node-mysql-plus?branch=master)
[![dependencies Status](https://david-dm.org/nwoltman/node-mysql-plus/status.svg)](https://david-dm.org/nwoltman/node-mysql-plus)
[![devDependencies Status](https://david-dm.org/nwoltman/node-mysql-plus/dev-status.svg)](https://david-dm.org/nwoltman/node-mysql-plus?type=dev)

A MySQL client for Node.js with methods for defining tables with auto-migration and making basic queries.

This module extends the popular [`mysql`](https://www.npmjs.com/package/mysql) module, so it can be safely dropped in as a replacement for that module before using any of its additional features. It is recommended that you read the [documentation](https://github.com/mysqljs/mysql#introduction) for the `mysql` module, especially the sections on [connection options](https://github.com/mysqljs/mysql#connection-options), [performing queries](https://github.com/mysqljs/mysql#performing-queries), [escaping query values](https://github.com/mysqljs/mysql#escaping-query-values), and [escaping query identifiers](https://github.com/mysqljs/mysql#escaping-query-identifiers).

> Requires Node v4 or higher

## Table of Contents

+ [Installation](#installation)
+ [Usage Example](#usage-example)
+ [API](#api)
  + Modules
    + [mysql-plus](#module_mysql-plus)
  + Classes
    + [PoolPlus](#PoolPlus)
    + [MySQLTable](#MySQLTable)
  + Info
    + [Migration Strategies](#migration-strategies)
    + [Defining Table Schemas](#defining-table-schemas)
    + [Column Types](#column-types)
+ [Roadmap](#roadmap)

## Installation

```sh
npm install mysql-plus --save
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
  autoIncrement: 5000000000,
});

const User = {
  insertAndSelectExample() {
    userTable.insert({email: 'newuser@email.com', name: 'newuser'}, (err, result) => {
      if (err) throw err;

      userTable.select('*', 'WHERE `id` = ' + result.insertId, (err, rows) => {
        if (err) throw err;
        console.log(rows);
        /*
          [{
            id: 5000000001,
            email: 'newuser@email.com',
            name: 'newuser'
          }]
        */
      });
    });
  }
};

module.exports = User;
```

#### app.js (Express example)

```js
const db = require('./db');
const express = require('express');
const app = express();

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
<dd><p>A class that extends the <code>mysql</code> module&#39;s <code>Pool</code> class with the ability to define tables.</p>
</dd>
<dt><a href="#MySQLTable">MySQLTable</a></dt>
<dd><p>A class that provides convenient methods for performing queries.</p>
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

**Extends:** <code>mysql</code>  
**See**: [mysql](https://github.com/mysqljs/mysql#mysql)  

* [mysql-plus](#module_mysql-plus) ⇐ <code>mysql</code>
    * ~~[~Type](#module_mysql-plus..Type)~~
    * [~ColTypes](#module_mysql-plus..ColTypes)
    * [~createPool(config)](#module_mysql-plus..createPool) ⇒ <code>[PoolPlus](#PoolPlus)</code>
    * [~queryCallback](#module_mysql-plus..queryCallback) : <code>function</code>


---

<a name="module_mysql-plus..Type"></a>

### ~~mysql-plus~Type~~
***Deprecated***

A namespace that provides the column type methods used to define columns.

**See**: [`mysqlPlus.ColTypes`](#module_mysql-plus..ColTypes)  

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

<a name="module_mysql-plus..createPool"></a>

### mysql-plus~createPool(config) ⇒ <code>[PoolPlus](#PoolPlus)</code>
Just like the original [`mysql.createPool()`](https://github.com/mysqljs/mysql#pooling-connections)
method except it returns a [`PoolPlus`](#PoolPlus) instance and accepts more options.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| config | <code>Object</code> |  | A configuration object defining MySQL connection options. In addition to the     possible [mysql connection options](https://github.com/mysqljs/mysql#connection-options),     this object may also have the following two options: |
| [config.migrationStrategy] | <code>string</code> |  | One of `safe`, `alter`, or `drop`.     Please see the migration strategies documentation [here](#migration-strategies).     Defaults to `safe` in production and `alter` everywhere else. |
| [config.allowAlterInProduction] | <code>boolean</code> | <code>false</code> | Setting this to `true` will     allow `alter` to be used as a migration strategy in production environments. |

**Returns**: <code>[PoolPlus](#PoolPlus)</code> - A new `PoolPlus` instance.  
**Example**:
```js
const mysql = require('mysql-plus');
const pool = mysql.createPool({
  host: 'example.org',
  user: 'me',
  password: 'secret',
  migrationStrategy: 'safe',
  allowAlterInProduction: false,
});
pool.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
  if (err) throw err;
  console.log('The solution is: ', rows[0].solution);
});
```


---

<a name="module_mysql-plus..queryCallback"></a>

### mysql-plus~queryCallback : <code>function</code>
A function called with the results of a query.


| Param | Type | Description |
| --- | --- | --- |
| error | <code>?Error</code> | An `Error` object if an error occurred; `null` otherwise. |
| results | <code>Array</code> &#124; <code>Object</code> | The results of the query. |
| fields | <code>Array.&lt;Object&gt;</code> | Information about the returned results' fields (if any). |

**See**: [https://github.com/mysqljs/mysql#performing-queries](https://github.com/mysqljs/mysql#performing-queries)  

---

<a name="PoolPlus"></a>

## PoolPlus ⇐ <code>Pool</code>
A class that extends the `mysql` module's `Pool` class with the ability to define tables.

**Extends:** <code>Pool</code>  
**See**: [Pool](https://github.com/mysqljs/mysql#pooling-connections)  

* [PoolPlus](#PoolPlus) ⇐ <code>Pool</code>
    * ~~[.Type](#PoolPlus+Type)~~
    * [.ColTypes](#PoolPlus+ColTypes)
    * [.defineTable(name, schema, [migrationStrategy])](#PoolPlus+defineTable) ⇒ <code>[MySQLTable](#MySQLTable)</code>
    * [.sync(cb)](#PoolPlus+sync) ⇒ <code>void</code>
    * [.pquery(sql, [values], [cb])](#PoolPlus+pquery) ⇒ <code>Promise</code>


---

<a name="PoolPlus+Type"></a>

### ~~poolPlus.Type~~
***Deprecated***

A namespace that provides the column type methods used to define columns.

**See**: [`poolPlus.ColTypes`](#PoolPlus+ColTypes)  

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

<a name="PoolPlus+defineTable"></a>

### poolPlus.defineTable(name, schema, [migrationStrategy]) ⇒ <code>[MySQLTable](#MySQLTable)</code>
Defines a table to be created or updated in the database.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the table. |
| schema | <code>Object</code> | An object that defines the table's schema.     See the [Defining Table Schemas](#defining-table-schemas) section. |
| [migrationStrategy] | <code>string</code> | One of `safe`, `alter`, or `drop`. This will override     the `migrationStrategy` value from the [`config`](#module_mysql-plus..createPool)     (but is still subject to the same restrictions in production environments). |

**Returns**: <code>[MySQLTable](#MySQLTable)</code> - A `MySQLTable` instance that lets you perform operations on the table.  
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

### poolPlus.sync(cb) ⇒ <code>void</code>
Syncs the defined tables to the database by creating new tables and dropping
or migrating existing tables (depending on the migration setting). Generally
should only be called once when starting up a server.


| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | A callback that is called once all defined table schemas have been synced to the     database. If an error occured, the first argument passed to the callback will be the error object. |

**Example**:
```js
pool.sync(function(err) {
  if (err) throw err;
  // Now do something such as start an HTTP server
});
```


---

<a name="PoolPlus+pquery"></a>

### poolPlus.pquery(sql, [values], [cb]) ⇒ <code>Promise</code>
The same `query` method as on the original mysql pool except when not passed a
callback it returns a promise that resolves with the results of the query.


| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> &#124; <code>Object</code> | An SqlString or options object. |
| [values] | <code>Array</code> | Values to replace placeholders in the SqlString. |
| [cb] | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | An optional callback that gets called with     the results of the query. |

**Returns**: <code>?Promise</code> - If the `cb` parameter is omitted, a promise that will resolve with the results
    of the query is returned.  
**See**: [https://github.com/mysqljs/mysql#performing-queries](https://github.com/mysqljs/mysql#performing-queries)  
**Example**: Promise example
```js
pool.pquery('SELECT * FROM `books` WHERE `author` = "David"')
  .then((results) => {
    // results will contain the results of the query
  })
  .catch((error) => {
    // error will be the Error that occurred during the query
  });
```

**Example**: Callback example
```js
pool.pquery('SELECT * FROM `books` WHERE `author` = "David"', (error, results, fields) => {
  // error will be an Error if one occurred during the query
  // results will contain the results of the query
  // fields will contain information about the returned results fields (if any)
});
```


---

<a name="MySQLTable"></a>

## MySQLTable
A class that provides convenient methods for performing queries.

**See**: [https://github.com/mysqljs/mysql#performing-queries](https://github.com/mysqljs/mysql#performing-queries)  

* [MySQLTable](#MySQLTable)
    * ~~[.tableName](#MySQLTable+tableName) : <code>string</code>~~
    * [.name](#MySQLTable+name) : <code>string</code>
    * [.schema](#MySQLTable+schema) : <code>string</code>
    * [.pool](#MySQLTable+pool) : <code>[PoolPlus](#PoolPlus)</code>
    * [.select(columns, [sqlString], [values], cb)](#MySQLTable+select) ⇒ <code>void</code>
    * [.insert(data, [sqlString], [values], cb)](#MySQLTable+insert) ⇒ <code>void</code>
    * ~~[.insertIgnore(data, cb)](#MySQLTable+insertIgnore) ⇒ <code>void</code>~~
    * ~~[.replace(data, cb)](#MySQLTable+replace) ⇒ <code>void</code>~~
    * [.update([data], [sqlString], [values], cb)](#MySQLTable+update) ⇒ <code>void</code>
    * [.delete([sqlString], [values], cb)](#MySQLTable+delete) ⇒ <code>void</code>
    * [.query()](#MySQLTable+query) ⇒ <code>void</code>


---

<a name="MySQLTable+tableName"></a>

### ~~mySQLTable.tableName : <code>string</code>~~
***Deprecated***

The table's name (as passed to [`poolPlus.defineTable()`](#PoolPlus+defineTable)).


---

<a name="MySQLTable+name"></a>

### mySQLTable.name : <code>string</code>
The table's name (as passed to [`poolPlus.defineTable()`](#PoolPlus+defineTable)).


---

<a name="MySQLTable+schema"></a>

### mySQLTable.schema : <code>string</code>
The table's schema (as passed to [`poolPlus.defineTable()`](#PoolPlus+defineTable)).


---

<a name="MySQLTable+pool"></a>

### mySQLTable.pool : <code>[PoolPlus](#PoolPlus)</code>
The `PoolPlus` instance that created this table.


---

<a name="MySQLTable+select"></a>

### mySQLTable.select(columns, [sqlString], [values], cb) ⇒ <code>void</code>
Selects data from the table.


| Param | Type | Description |
| --- | --- | --- |
| columns | <code>Array.&lt;string&gt;</code> &#124; <code>string</code> | An array of columns to select or a custom `SELECT` string. |
| [sqlString] | <code>string</code> | SQL to be appended to the query after the `FROM table` clause. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString` and `columns`. |
| cb | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Example**: Select all columns
```js
userTable.select('*', (err, rows) => {
  if (err) throw err;
  // rows contains all data for all users
});
```

**Example**: Select specific columns
```js
userTable.select(['email', 'name'], 'WHERE `points` > 10000', (err, rows) => {
  if (err) throw err;
  console.log(rows); // -> [{email: 'email@example.com', name: 'John Doe'}, etc.]
});
```

**Example**: Select with placeholders
```js
userTable.select(['email'], 'WHERE `id` = ?', [5], (err, rows) => {
  if (err) throw err;
  console.log(rows); // -> [{email: 'email@example.com'}]
});

userTable.select('??', 'WHERE ?', ['email', {id: 5}], (err, rows) => {
  if (err) throw err;
  console.log(rows); // -> [{email: 'email@example.com'}]
});
```

**Example**: Select columns with aliases
```js
userTable.select('`display_name` AS `name`', 'WHERE `points` > 10000', (err, rows) => {
  if (err) throw err;
  console.log(rows); // -> [{name: 'JohnD'}, etc.]
});
```

**Example**: Select using a function
```js
userTable.select('COUNT(*) AS `highScorers`', 'WHERE `points` > 10000', (err, rows) => {
  if (err) throw err;
  console.log(rows); // -> [{highScorers: 27}]
});
```


---

<a name="MySQLTable+insert"></a>

### mySQLTable.insert(data, [sqlString], [values], cb) ⇒ <code>void</code>
Inserts data into a new row in the table.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> &#124; <code>Array</code> | An object of (column name)-(data value) pairs or     an array containing either 1) an array of arrays of data values or 2) an array     of column names and the data array from 1). |
| [sqlString] | <code>string</code> | SQL to be appended to the query.<br>This would only be used to add     an `ON DUPLICATE KEY UPDATE` clause. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString`. |
| cb | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Example**: Insert a new user
```js
userTable.insert({email: 'email@example.com', name: 'John Doe'}, (err, result) => {
  if (err) throw err;
  // data inserted!
});
```

**Example**: Insert or update
```js
const data = {id: 5, points: 100};
// If duplicate key (id), add the points
const onDuplicateKeySQL = 'ON DUPLICATE KEY UPDATE `points` = `points` + ?';
userTable.insert(data, onDuplicateKeySQL, [data.points], (err, result) => {
  if (err) throw err;
  // data inserted or updated!
});
```

**Example**: Bulk insert
```js
const users = [
  [1, 'john@email.com', 'John Doe'],
  [2, 'jane@email.com', 'Jane Brown'],
];
userTable.insert([users], (err, result) => {
  if (err) throw err;
  // users inserted!
});
```

**Example**: Bulk insert with specified columns
```js
const users = [
  ['john@email.com', 'John Doe'],
  ['jane@email.com', 'Jane Brown'],
];
userTable.insert([['email', 'name'], users], (err, result) => {
  if (err) throw err;
  // users inserted!
});
```


---

<a name="MySQLTable+insertIgnore"></a>

### ~~mySQLTable.insertIgnore(data, cb) ⇒ <code>void</code>~~
***Deprecated***

Inserts data into a new row in the table. The row is not
inserted if it would result in a duplicate key error.

__Note:__ Be aware that if the insert is ignored, the table's `AUTO_INCREMENT`
value (if there is one) may be incremented anyway due to a bug in MySQL.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | An object of (column name)-(data value) pairs. |
| cb | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Example**:
```js
userTable.insertIgnore({email: 'email@example.com', name: 'John Doe'}, (err, result) => {
  if (err) throw err;
  // data inserted! (maybe)
});
```


---

<a name="MySQLTable+replace"></a>

### ~~mySQLTable.replace(data, cb) ⇒ <code>void</code>~~
***Deprecated***

Replaces a row in the table with new data.


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | An object of (column name)-(data value) pairs. |
| cb | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Example**:
```js
// `id` is a primary key
userTable.replace({id: 5, email: 'newemail@example.com', name: 'Jane Doe'}, (err, result) => {
  if (err) throw err;
  // row with id = 5 replaced with new data!
});
```


---

<a name="MySQLTable+update"></a>

### mySQLTable.update([data], [sqlString], [values], cb) ⇒ <code>void</code>
Updates data in the table.

__Note:__ The `data` and `sqlString` arguments are individually
optional but at least one of them must be specified.


| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>Object</code> | An object of (column name)-(data value) pairs that define the new column values.     This object will be escaped by `mysql.escape()` so if you want to use more sophisticated SQL (such as     a MySQL function) to update a column's value, you'll need to use the `sqlString` argument instead. |
| [sqlString] | <code>string</code> | SQL to be appended to the query after the `SET data` clause     or immediately after `SET ` if `data` is omitted. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString` (and/or `data`). |
| cb | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Example**: With both the `data` and `sqlString` arguments
```js
userTable.update({email: 'updated@email.com'}, 'WHERE `id` = ?', [5], (err, result) => {
  if (err) throw err;
  // email updated!
});
```

**Example**: With only the `sqlString` argument
```js
userTable.update("`word` = CONCAT('prefix', `word`)", (err, result) => {
  if (err) throw err;
  // prefix added to all words!
});

userTable.update('`points` = `points` + ? WHERE `winner` = ?', [1, 1], (err, result) => {
  if (err) throw err;
  // 1 point added to all winners!
});
```

**Example**: With only the `data` argument (updates all rows)
```js
userTable.update({points: 1000}, (err, result) => {
  if (err) throw err;
  // Now everyone has 1000 points!
});
```


---

<a name="MySQLTable+delete"></a>

### mySQLTable.delete([sqlString], [values], cb) ⇒ <code>void</code>
Deletes data from the table.


| Param | Type | Description |
| --- | --- | --- |
| [sqlString] | <code>string</code> | SQL to be appended to the query after the `FROM table` clause. |
| [values] | <code>Array</code> | Values to replace the placeholders in `sqlString`. |
| cb | <code>[queryCallback](#module_mysql-plus..queryCallback)</code> | A callback that gets called with the results of the query. |

**Example**: Delete specific rows
```js
userTable.delete('WHERE `spammer` = 1', (err, result) => {
  if (err) throw err;
  // spammers deleted!
});
```

**Example**: Delete all rows (you probably don't want to do this)
```js
userTable.delete((err, result) => {
  if (err) throw err;
  // all rows deleted :(
});
```


---

<a name="MySQLTable+query"></a>

### mySQLTable.query() ⇒ <code>void</code>
Exactly the same as [`pool.query()`](https://github.com/mysqljs/mysql#performing-queries).


---


## Migration Strategies

The possible migration strategies are as follows:

+ `safe` - default in a production environment (`NODE_ENV === 'production'`)
+ `alter` - default in a development environment
+ `drop`

In addition to being the default in a production environment, the `safe` strategy is the only allowed strategy in production. This means that if `alter` or `drop` are used anywhere to configure your connections or tables, they will be ignored and `safe` will be used instead. However, if you really want to use `alter` in production, you may set the `allowAlterInProduction` option to `true` in your [Pool configuration](#mysql-pluscreatepoolconfig--poolplus).

### safe

Only allows newly-defined tables to be created. Existing tables are never changed in any way.

### alter

Specifies that newly-defined tables will be created, existing tables that are no longer defined will be dropped, and existing tables that have a different definition from what is found in the database will be migrated with minimal data-loss.

**To rename table columns**, you must specify the column's old name in the [column definition](#columndefinition) with the `.oldName('name')` method. If you don't, the column will be dropped and you will lose all of the data that was in that column.

**Note:** It is up to you to understand how changes to an existing table might affect the data. For example, changing a DOUBLE column to a FLOAT will cause the precision of the value to be reduced so you may lose some significant digits (i.e. `1.123456789` would be reduced to `1.12346`). Furthermore, some changes to tables cannot be done and will cause an error. An example of this would be adding a column with the `NOT NULL` attribute to a non-empty table without specifying a default value.

### drop

All defined tables will be dropped and recreated.


## Defining Table Schemas

A schema is defined by a JavaScript object with certain properties. For `mysql-plus`, the schema properties can be broken down into four main types:

+ [Columns](#columns)
+ [Keys](#keys)
+ [Foreign Keys](#foreign-keys)
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

See the [Column Types](#column-types) section for all possible column types and attributes that you can define.

### Keys

There are three properties that can be used to define different types of keys:

+ [`primaryKey`](#primarykey--stringstring)
+ [`uniqueKeys`](#uniquekeys--arraystringstring)
+ [`indexes`](#indexes--arraystringstring)

Note that [column definitions](#columndefinition) allow you to define these keys directly on the column. If you use that method of defining a key for a column, you should not define the key again using one of these properties.

#### `primaryKey` : `string|string[]`

Used to define the table's primary key. Its value is the name of one or more columns that make up the primary key.

**Example:**
```js
// Single column primary key
{
  primaryKey: 'id',
}

// Multi-column primary key
{
  primaryKey: ['userID', 'videoID'],
}
```

#### `uniqueKeys` : `Array.<string|string[]>`

Used to define the table's unique keys. Its value is an array where the elements are the names of one or more columns that make up a unique key.

**Example:**
```js
{
  uniqueKeys: [
    'email',    // Single column unique key
    ['a', 'b'], // Multi-column unique key
  ],
}
```

#### `indexes` : `Array.<string|string[]>`

Used to define the table's indexes. Its value is an array where the elements are the names of one or more columns that make up an index.

**Example:**
```js
{
  indexes: [
    'points',   // Single column index
    ['a', 'b'], // Multi-column index
  ],
}
```

### Foreign Keys

Foreign keys are defined using the `foreignKeys` property, which is an object that maps column names to a reference table column. The reference table column can be specified with either an object or a string of the form `<table name>.<column name>`. If an object, the following properties may be set: `table` (required), `column` (required), `onDelete`, `onUpdate`.

**Example:**
```js
{
  columns: {
    id: /* ... */,
    userID: /* ... */,
    thingOne: /* ... */,
    thingTwo: /* ... */,
  },
  foreignKeys: {
    // String with shorthand reference
    id: 'other_table.id', // shorthand for {table: 'other_table', column: 'id'}

    // Object reference with ON DELETE and ON UPDATE attributes
    userID: {
      table: 'user',
      column: 'id',
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    },

    // Multi-column foreign key (uses comma-separated column names)
    'thingOne, thingTwo': {
      table: 'thing_table',
      column: ['one', 'two'],
    },
  },
}
```

**Note:** Foreign keys aren't actually keys, but "constraints". When defining foreign key constraints, the columns that make up the constraints should also be keys.

**Example:** Keys required for the example above
```js
{
  primaryKey: 'id',
  uniqueKeys: [
    'userID',
  ],
  indexes: [
    ['thingOne', 'thingTwo'],
  ],
}
```

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
  collate: 'utf8mb4_unicode_ci',
  compression: 'LZ4',
  rowFormat: 'COMPACT',
}
```

**Note:** After explicitly defining a table option in your schema, if you remove it from your schema and resync your table definitions, the table option will not change in the database. If you want to go back to the default value for the table option, you'll need to explicitly define it on your schema and resync the table (or manually change it on the command line), and then you may remove it from your schema.

## Column Types

[`mysql.ColTypes`](#module_mysql-plus..ColTypes) and [`pool.ColTypes`](#PoolPlus+ColTypes) both expose the following methods:

+ `tinyint([m])`
+ `smallint([m])`
+ `mediumint([m])`
+ `int([m])`
+ `integer([m])`
+ `bigint([m])`
+ `float([m [, d]])`
+ `double([m [, d]])`
+ `decimal([m [, d]])`
+ `dec([m [, d]])`
+ `numeric([m [, d]])`
+ `fixed([m [, d]])`
+ `bit([m])`
+ `bool()`
+ `boolean()`
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

All of these methods return a `ColumnDefinition` class.

#### ColumnDefinition

This class is what is used to define the column's attributes. These attributes can be set using the following methods:

+ `notNull()` - Adds the `NOT NULL` attribute
+ `default(value)` - Sets the column's `DEFAULT` value (escapes the input value).
  + Example: `.default('Hello')` produces `DEFAULT 'Hello'`
+ `defaultRaw(value: string)` - Sets the column's `DEFAULT` value (does not escape the input value).
  + Example: `.defaultRaw('NOW()')` produces `DEFAULT NOW()`
+ `primaryKey()` - Declares the column to be the table's primary key
+ `unique()` - Declares the column as a unique index
+ `index()` - Declares the column as an index
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

+ `onUpdateCurrentTimestamp()` - Adds the `ON UPDATE CURRENT_TIMESTAMP` attribute

Compatible types:

+ `datetime`
+ `timestamp`


# Roadmap

+ Prepared statements
