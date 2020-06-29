# CHANGELOG

## 0.16.2 (2020-06-29)

### Improvements
+ improvement: Support MariaDB's CURRENT_TIMESTAMP format ([`5c6d3c7`](https://github.com/nwoltman/node-mysql-plus/commit/5c6d3c711f304ee97d3a2c790dab353594936ce9))

### Documentation
+ docs: Remove "--save" from npm install command ([`ed932c9`](https://github.com/nwoltman/node-mysql-plus/commit/ed932c99e19c14aca479234fbb90618b295b225d))

## 0.16.1 (2020-02-13)

### Improvements
+ chore: Fix typo in CHANGELOG ([`a821775`](https://github.com/nwoltman/node-mysql-plus/commit/a8217756f8775fd6f394e548d845890d6b5e1f1a))
+ refactor: Use `Array.isArray()` instead of `instanceof Array` ([`4e73a2e`](https://github.com/nwoltman/node-mysql-plus/commit/4e73a2ea6e03b4c65cd2f9d3ca7002be27da54ca))
+ chore(ci): Remove Node 8 and add Node 13 ([`0e7511a`](https://github.com/nwoltman/node-mysql-plus/commit/0e7511a08abcca9b4725224ca9b0b14bb56b9bdd))
+ chore(deps): [`mysql@2.18.1`](https://github.com/mysqljs/mysql/blob/master/Changes.md#v2181-2020-01-23) ([`1f5571d`](https://github.com/nwoltman/node-mysql-plus/commit/1f5571da8b70a4d532fb61cb8df8af45126b14d7))

## 0.16.0 (2019-05-09)

### Breaking Changes
+ feat!: Change the interface for how keys are defined in the table schema ([`8cab7ce`](https://github.com/nwoltman/node-mysql-plus/commit/8cab7ce8c7113634a72e103fff7c84194feab2bf))
  + Check out the [new documentation](https://github.com/nwoltman/node-mysql-plus#keys) on how to define table keys
+ chore(ci)!: Update config and stop testing on Node 6 and 11 ([`56564e8`](https://github.com/nwoltman/node-mysql-plus/commit/56564e87dfe689a437d32fa17a44582c529b1e7b))

### New Features
+ feat: Add support for FULLTEXT indexes ([`673fad7`](https://github.com/nwoltman/node-mysql-plus/commit/673fad75beef5caca6d57592b4e24d4c2015064b))
+ feat: Add support for key prefix lengths ([`13e185d`](https://github.com/nwoltman/node-mysql-plus/commit/13e185d059dc826d903ef6bb33428b0c452a1b91))

### Improvements
+ improvement: Don't run unnecessary DROP/ADD_FOREIGN_KEY operations ([`687df26`](https://github.com/nwoltman/node-mysql-plus/commit/687df26988be4611089d8ffee0564d9880891b06))
+ improvement: Improve error messages when creating ColumnDefinitions with improper arguments ([`fff463e`](https://github.com/nwoltman/node-mysql-plus/commit/fff463e0d695c7f6ab44d6e150a655fd49e8897f))
+ chore(deps): mysql@2.17.1 ([`6281eab`](https://github.com/nwoltman/node-mysql-plus/commit/6281eab4c81c5a4d02eac92ba72c5b48a75fe71c))
+ chore: Fix spelling - 'geometrical' -> 'geometry' ([`b88c815`](https://github.com/nwoltman/node-mysql-plus/commit/b88c81548939bcacb6bb69bd787ea2be3a842c2c))

### Documentation
+ docs: Use clearer language in the readme intro ([`ceb11ca`](https://github.com/nwoltman/node-mysql-plus/commit/ceb11ca9b6f2110fa1b926587a771f2e8d1d12c9))


## 0.15.0 (2018-08-12)

### Breaking Changes
+ Drop support for Node 4 ([`e1f25a9`](https://github.com/nwoltman/node-mysql-plus/commit/e1f25a91a915d2070d0d4acbdb89a54eb233d787))
+ ci: Stop testing on Node 9 ([`af9117f`](https://github.com/nwoltman/node-mysql-plus/commit/af9117f3ee5220a4e81340ce69ee86d5af7fe8b4))

### New Features
+ deps: mysql@2.16.0 ([`e62a99a`](https://github.com/nwoltman/node-mysql-plus/commit/e62a99ad9cade81a6f6caecc4c481aab86592446))
  + [See `mysql` changes](https://github.com/mysqljs/mysql/blob/master/Changes.md#v2160-2018-07-17)
+ ci: Test on Node 10 ([`c4dfb02`](https://github.com/nwoltman/node-mysql-plus/commit/c4dfb0264422f228c1bff81d92444dfc80773195))

### Bug Fixes
+ fix: Run "ADD COLUMN" operations before "MODIFY/CHANGE COLUMN" operations ([`5e72c04`](https://github.com/nwoltman/node-mysql-plus/commit/5e72c047a3cd861256de5c6fb36dda4006ff1f3d))

### Documentation
+ doc: Add section for known migrations that will not work ([`0650b44`](https://github.com/nwoltman/node-mysql-plus/commit/0650b44e61830ed0325911bea01c905a054de170))


## 0.14.0 (2018-02-15)

### Breaking Changes
+ lib: Remove support for deprecated `{__raw: ...}` objects ([`739a293`](https://github.com/nwoltman/node-mysql-plus/commit/739a293b21d5ca5fe6e2080d1a81f6314d44a310))

### New Features
+ PoolPlus: Add Promise support to [`pool.sync()`](https://github.com/nwoltman/node-mysql-plus#PoolPlus+sync) ([`0704b40`](https://github.com/nwoltman/node-mysql-plus/commit/0704b4023c020e672ad6d6e93e5af01074b828a6))

#### Performance
+ lib: Use `===` where possible ([`9d31c23`](https://github.com/nwoltman/node-mysql-plus/commit/9d31c2348f68aabf41006b772ddf7b1c5fd9e526))

### Documentation
+ docs: Simplify initial example and use `async-await` ([`9987b43`](https://github.com/nwoltman/node-mysql-plus/commit/9987b43882bf821b1e89aee46b39519c7553cde5))
+ docs: Avoid using pronouns where possible ([`913d92c`](https://github.com/nwoltman/node-mysql-plus/commit/913d92c020a3f0bb11ebcb05ef314d2dbe4dfa91))


## 0.13.1 (2018-01-28)

### Deprecations
+ lib: Log a deprecation message when a `{__raw: ...}` object is used ([`ec00429`](https://github.com/nwoltman/node-mysql-plus/commit/ec00429f59a26175f02eb3f1f91aea1ae7e6160d))

### Documentation
+ docs: Add spatialIndexes to table of contents for Keys section ([`3a31e05`](https://github.com/nwoltman/node-mysql-plus/commit/3a31e05ac1c0b5bc34ad0787b3b99659b8597f4f))
+ docs: Amend the deprecation plan for `{__raw: ...}` objects ([`774b9d3`](https://github.com/nwoltman/node-mysql-plus/commit/774b9d3ac597f693230144e7e5d2a0b1214814e6))


## 0.13.0 (2017-11-08)

### Deprecations
+ lib: Remove `{__raw: ...}` object documentation ([`1ad76d0`](https://github.com/nwoltman/node-mysql-plus/commit/1ad76d037811aa8c4ae8a1ecfda5c035a661b468))
  + Use `mysql.raw()` or [`pool.raw()`](https://github.com/nwoltman/node-mysql-plus#PoolPlus+raw) instead to create raw values
  + This is currently a soft deprecation. In `v0.13.1`, `mysql-plus` will log a warning if you use a `{__raw: ...}` object with the [`MySQLTable#insertIfNotExists()`](https://github.com/nwoltman/node-mysql-plus#MySQLTable+insertIfNotExists) method and support for `{__raw: ...}` objects will be removed completely in `v0.14.0`.

### New Features
+ deps: mysql@2.15.0 ([`91ff662`](https://github.com/nwoltman/node-mysql-plus/commit/91ff662870ee58fee45c1cf71d4421dc8d7991af))
  + [See `mysql` changes](https://github.com/mysqljs/mysql/blob/master/Changes.md#v2150-2017-10-05)
+ lib: Improve debug output formatting ([`a43815f`](https://github.com/nwoltman/node-mysql-plus/commit/a43815f14909ecf027c541149d0a1a689e0b4d57))
+ PoolPlus: Add `.raw()` method ([`f0779c9`](https://github.com/nwoltman/node-mysql-plus/commit/f0779c97d83f6fadb9938ec90918c8b83711407c))
  + This is an alias of the `mysql.raw()` function added in `mysql@2.15.0`
+ TableDefinition: Expand foreign key shorthand syntax ([`ccb3c53`](https://github.com/nwoltman/node-mysql-plus/commit/ccb3c53d222848c95f1d8ae5d989c89d899e8764))
  + You can now specify the `onDelete` and `onUpdate` options in the shorthand like so: `table.column CASCADE`

### Misc
+ ci: Test on Node 9 ([`6c44566`](https://github.com/nwoltman/node-mysql-plus/commit/6c445665d4db74a4671e13bea66b224507cd3289))
+ Rename 'LICENSE' -> 'LICENSE.txt' ([`5b588f8`](https://github.com/nwoltman/node-mysql-plus/commit/5b588f8ebc86b8c119a7d693d106046203de34cd))


## 0.12.1 (2017-08-18)

+ lib: Fix debug formatting + improve foreign key operation formatting ([`9f714a7`](https://github.com/nwoltman/node-mysql-plus/commit/9f714a78df557533d4ecf3ba82bddc201fba4e58))


## 0.12.0 (2017-08-18)

### Notable Changes
+ TableDefinition: When a column changes, update its position ([`3836d3b`](https://github.com/nwoltman/node-mysql-plus/commit/3836d3bf99b95ae5fcfc3d5305e1ec2df03b077d))
+ lib: Replace lodash/isEmpty with a custom function ([`a2b68f9`](https://github.com/nwoltman/node-mysql-plus/commit/a2b68f991e8533d6a9fbe619c8d73ae1ba6f4167))
+ lib: Replace lodash/cloneDeep with a custom function for cloning keys ([`73651c9`](https://github.com/nwoltman/node-mysql-plus/commit/73651c926512a65d13bd20e7733c1a3b21946dde))
+ lib: Replace lodash/isEqual with a custom function for comparing key definitions ([`db32bec`](https://github.com/nwoltman/node-mysql-plus/commit/db32bec59cab6c9f9ae500c519443d71c5863e99))
  + Lodash is no longer a dependency!
+ lib: Change how debugging logs to the console and test debugging code ([`c9aacb2`](https://github.com/nwoltman/node-mysql-plus/commit/c9aacb28de04ec796c23ddbf028b593b8e1a6a9c))
+ deps: [mysql@2.14.1](https://github.com/mysqljs/mysql/blob/master/Changes.md#v2141-2017-08-01) ([`adfb9b4`](https://github.com/nwoltman/node-mysql-plus/commit/adfb9b4289a2663a65e943c0d211e1cd92790424))


## 0.11.1 (2017-06-26)

### Bug Fixes
+ lib: Fix bug when migrating a table with foreign keys to having none ([`f9867da`](https://github.com/nwoltman/node-mysql-plus/commit/f9867da3bc9699bbe38ab4e838136d31c0bfe94b))

### Misc
+ Test on Node 8


## 0.11.0 (2017-04-25)

### Breaking Changes (that fix bugs)
+ lib: Always drop keys not created by mysql-plus during migrations ([`6bfa2af`](https://github.com/nwoltman/node-mysql-plus/commit/6bfa2af04a5c8a3c5411a9c58c63b643535d2cea))
  + This fixes a bug where syncing would throw an error when attempting to drop a key not created by `mysql-plus`.
+ ColumnDefinitions: Define certain numeric types as synonyms ([`79c5acb`](https://github.com/nwoltman/node-mysql-plus/commit/79c5acb67795eedd82cb8b7b3d1ef60a27a40dc3))
  + This fixes a bug where using `integer`, `dec`, `numeric`, `fixed`, `bool`, or `boolean` would always cause the table to run unnecessary `ALTER` queries during migrations.
  + Feature: The `bool` and `boolean` ColType methods now return a [`NumericColumnDefinition`](https://github.com/nwoltman/node-mysql-plus#numericcolumndefinition) instance.

### New Features
+ MySQLTable: Implement an [`.exists()`](https://github.com/nwoltman/node-mysql-plus#MySQLTable+exists) method ([`a01e6fb`](https://github.com/nwoltman/node-mysql-plus/commit/a01e6fb23625afd1249c4fadb78738afc46aacab))
+ doc: Fix `MySQLTable#insert()` example with using only the `sqlString` argument ([`1da7a2a`](https://github.com/nwoltman/node-mysql-plus/commit/1da7a2ad99debafa9ecf9e3e5d50652361935af6))


## 0.10.1 (2017-04-14)

### Bug Fixes
+ lib: Fix bug when migrating a table with no foreign keys to having some ([`fa8960b`](https://github.com/nwoltman/node-mysql-plus/commit/fa8960b128340a205cd28fd15e49b190f092aca7))


## 0.10.0 (2017-04-05)

### Possibly Breaking Changes
+ feat: When new columns are added during migrations, add them in the same position that they are defined in the `columns` object ([`beddf36`](https://github.com/nwoltman/node-mysql-plus/commit/beddf364263ea56d36c2ed12b103022334f95351))
  + Only breaking if you directly test the result of `SHOW CREATE TABLE` after migrations
+ PoolPlus: Make [`.defineTable()`](https://github.com/nwoltman/node-mysql-plus#PoolPlus+defineTable) throw a `TypeError` (instead of `Error`) if name is not a string ([`b6489fe`](https://github.com/nwoltman/node-mysql-plus/commit/b6489fe7de666a937f7132112da4450618c9a9e0))
  + Mostly likely won't break anything

### New Features
+ PoolPlus: Add [`.basicTable()`](https://github.com/nwoltman/node-mysql-plus#PoolPlus+basicTable) method that just creates a `MySQLTable` instance ([`2ca6e43`](https://github.com/nwoltman/node-mysql-plus/commit/2ca6e4389b1c4a13aeec5fbc18b2a49aa3117b1a))


## 0.9.0 (2017-03-26)

### Breaking Changes
+ ColumnDefinition: Make timestamp columns NULL by default ([`dfcd030`](https://github.com/nwoltman/node-mysql-plus/commit/dfcd030d52ff033f9121062f7048b51d387e5fb0))
  + See the [TimestampColumnDefinition documentation](https://github.com/nwoltman/node-mysql-plus#timestampcolumndefinition) for details


## 0.8.0 (2017-03-21)

### Possibly Breaking Changes
+ MySQLTable: Simplify parsing arguments to [`.insert()`](https://github.com/nwoltman/node-mysql-plus#MySQLTable+insert) and [`.update()`](https://github.com/nwoltman/node-mysql-plus#MySQLTable+update) ([`725cdfa`](https://github.com/nwoltman/node-mysql-plus/commit/725cdfa6b70639f0f1292ca500bd4425454a3f2e))
  + Should not be a breaking change if you don't pass strings or numbers as the `values` parameter and you don't use `undefined` or `null` to fill in unused arguments (i.e. `.insert({data}, undefined, undefined, callback)`)

### New Features
+ MySQLTable: Implement new [`.insertIfNotExists()`](https://github.com/nwoltman/node-mysql-plus#MySQLTable+insertIfNotExists) method ([`1791688`](https://github.com/nwoltman/node-mysql-plus/commit/17916886b1d1db34c8b37966f6c9e8b4824b342a))
+ MySQLTable: Allow [`.insert()`](https://github.com/nwoltman/node-mysql-plus#MySQLTable+insert) to accept a string as the first parameter ([`f4c9d92`](https://github.com/nwoltman/node-mysql-plus/commit/f4c9d922a6b3a806dee434ea3b080933937ebca6))
+ docs: Show generated SQL in MySQLTable query examples ([`785d853`](https://github.com/nwoltman/node-mysql-plus/commit/785d853ead1692091bc3b2f5966cf7d699b2814b))

### Bug Fixes
+ MySQLTable: Fix bug in [`.insert()`](https://github.com/nwoltman/node-mysql-plus#MySQLTable+insert) where `sqlString` was ignored if data was an array ([`55cc324`](https://github.com/nwoltman/node-mysql-plus/commit/55cc324adccdc6f3b79f45ec8e4a19c09077e79e))


## 0.7.0 (2017-03-13)

### Breaking Changes
+ PoolPlus: Remove deprecation error in constructor ([`d9c416f`](https://github.com/nwoltman/node-mysql-plus/commit/d9c416fd1bad51acd0f960d9b0ce44692ee27722))

### New Features
+ deps: mysql@2.13.0 ([`9d95934`](https://github.com/nwoltman/node-mysql-plus/commit/9d95934b11ab748f72d9dcf03ab551cce00be696))
+ TableDefinition: Beautify CREATE TABLE statements to make debugging easier ([`40d93e1`](https://github.com/nwoltman/node-mysql-plus/commit/40d93e1442cf41f84b4674da4150e5be995c2310))
+ lib: Make debugging section separators the same length ([`4d92886`](https://github.com/nwoltman/node-mysql-plus/commit/4d92886b0ff18ea064ce67577fb962b5711e6302))

### Bug Fixes
+ lib: Combine all ALTER statements into a single statement before running the query ([`a92e330`](https://github.com/nwoltman/node-mysql-plus/commit/a92e3304972675fe61e4a0e953f3283d140ff526))
  + Fixes issues with migrating tables with an AUTO_INCREMENT column
+ PoolPlus: Fix bug in debug mode where the sync callback would not get called ([`231e7ec`](https://github.com/nwoltman/node-mysql-plus/commit/231e7ec62a5f45612fa2056c0106d2d39b6fe214))


## 0.6.3 (2017-02-25)

### New Features
+ PoolPlus: Add debugging to #sync() and fix incorrect documentation ([`bdbce55`](https://github.com/nwoltman/node-mysql-plus/commit/bdbce554b12f89bc1bfcd7d22e43a1339a476e6d))
+ perf: Add fast path in diffKeys() for when either input is null ([`d3b66eb`](https://github.com/nwoltman/node-mysql-plus/commit/d3b66eb27b9bf42148009c6f7d2649fd779d2e72))

### Bug Fixes
+ lib: Fix bug when altering a multi-column index and the first column in that index has a foreign key ([`585b7dc`](https://github.com/nwoltman/node-mysql-plus/commit/585b7dc9ac1d43ba4cf6b8bca5cc3ec50004c8fc))


## 0.6.2 (2017-02-18)

### Bug Fixes
+ lib: Fix foreign key bug introduced in [`d43235a`](https://github.com/nwoltman/node-mysql-plus/commit/d43235a56772115ac1b945cc670f7ffd8f76c447) ([`03374e4`](https://github.com/nwoltman/node-mysql-plus/commit/03374e4746cc606e92d5d4676cce1c122cf559c9))
+ lib: Fix bug caused by columns with a default value ([`8f1e963`](https://github.com/nwoltman/node-mysql-plus/commit/8f1e963c5c9b3ca85959b75f5bbe9eb2994c72bb))


## 0.6.1 (2017-02-11)

### New Features
+ lib: Support spatial indexes ([`9a4a2be`](https://github.com/nwoltman/node-mysql-plus/commit/9a4a2be169294c49bb2be9318a3eead342626148))
+ ColumnDefinitions: Add support for spatial data (geometry) and JSON column types ([`46f3034`](https://github.com/nwoltman/node-mysql-plus/commit/46f3034b24fe25c718522b17e1aad42b0d1e63a6))


## 0.6.0 (2017-02-09)

### Breaking Changes
+ lib: Require the "migrationStrategy" and "allowAlterInProduction" options to be under a "plusOptions" config property ([`744e492`](https://github.com/nwoltman/node-mysql-plus/commit/744e4922206357c265e9d9620efe8e7d6ddb218d))
+ lib: Remove the deprecated `Type` namespace ([`3226971`](https://github.com/nwoltman/node-mysql-plus/commit/32269715efddb1c6fb1cfb74a74b07c1e0e14af9))
+ MySQLTable: Remove the deprecated `tableName` instance property ([`db99fbf`](https://github.com/nwoltman/node-mysql-plus/commit/db99fbfaa8fddb1c27870324310edba48de9a94f))
+ MySQLTable: Remove the deprecated `.insertIgnore()` and `.replace()` methods ([`14aca60`](https://github.com/nwoltman/node-mysql-plus/commit/14aca60f8059f3857b34929d38f3a0078bc851fc))
+ ColumnDefinition: Remove deprecated `.defaultRaw()` method ([`709c6f8`](https://github.com/nwoltman/node-mysql-plus/commit/709c6f88b30b8e9a27d9e3b6024d407776250f7f))
+ ColumnDefinition: Remove deprecated handling of `.default('CURRENT_TIMESTAMP')` ([`ca1ace4`](https://github.com/nwoltman/node-mysql-plus/commit/ca1ace48adf955a3425cab5de3f489c1852474a6))

### New Features
+ lib: Add `debug` config option ([`baf89ee`](https://github.com/nwoltman/node-mysql-plus/commit/baf89eebd49018c0d04c19a0773f6d9affbc214c))

### Bug Fixes
+ lib: Prevent error when changing columns or keys with foreign keys ([`d43235a`](https://github.com/nwoltman/node-mysql-plus/commit/d43235a56772115ac1b945cc670f7ffd8f76c447))


## 0.5.0 (2016-12-12)

### Deprecations
+ ColumnDefinition: Deprecate `.defaultRaw()` ([`ee10a0c`](https://github.com/nwoltman/node-mysql-plus/commit/ee10a0cbc740c1f40c8bade9c07cb8889d7de568))
+ lib: Update deprecation warnings to say things will be removed in 0.6.0 (instead of 0.5.0) ([`3273395`](https://github.com/nwoltman/node-mysql-plus/commit/3273395be80fa2345fde67076875414593c11d45))

### New Features
+ UpdatableTimeColumnDefinition: Add [`.defaultCurrentTimestamp()`](https://github.com/nwoltman/node-mysql-plus#updatabletimecolumndefinition) method ([`949d72f`](https://github.com/nwoltman/node-mysql-plus/commit/949d72f5a7f04b4da57b484e27fa0eeca946aa0e))


## 0.4.1 (2016-12-10)

### Bug Fixes
+ TableDefinition: Use `defaultRaw()` over `default()` when appropriate ([`4d0ed0f`](https://github.com/nwoltman/node-mysql-plus/commit/4d0ed0f6f794c42d0963f4969cbf36f291af71ac))
+ changelog: Add missing deprecation ([`5420a08`](https://github.com/nwoltman/node-mysql-plus/commit/5420a08577e21316dc3dd420f322346ee782625f))


## 0.4.0 (2016-12-08)

### Deprecations
+ lib: Deprecate the `Type` namespace in favour of the new `ColTypes` namespace ([`56f56e1`](https://github.com/nwoltman/node-mysql-plus/commit/56f56e1a3988891a695fee2d66ee06400f6c3e86))
+ MySQLTable: Deprecate `tableName` property in favour of new `name` property ([`1916ddc`](https://github.com/nwoltman/node-mysql-plus/commit/1916ddccca9a9fc9c3ea4a5bfd1f71faf455e09b))
+ MySQLTable: Deprecate the `.insertIgnore()` and `.replace()` methods ([`9613737`](https://github.com/nwoltman/node-mysql-plus/commit/9613737475d74cdf5bace1bdb626f994a3265223))
+ ColumnDefinition: Deprecate usage of `.default('CURRENT_TIMESTAMP')` ([`4dec938`](https://github.com/nwoltman/node-mysql-plus/commit/4dec9381ca03220dbb0152c7b65d5df2abb91521))
  + Use the [`.defaultRaw()`](https://github.com/nwoltman/node-mysql-plus#columndefinition) method instead

### New features and other changes
+ deps: Bump minimum mysql and lodash versions to most recent ([`c29c9d6`](https://github.com/nwoltman/node-mysql-plus/commit/c29c9d663a56b032130194e50f34382739e4f6d9))
+ MySQLTable: Add the `.transacting()` method ([`8c4905e`](https://github.com/nwoltman/node-mysql-plus/commit/8c4905e5a4954d512000caddd1646ff30cecd82e))
+ PoolPlus: Use a transaction when syncing defined tables ([`2f75c04`](https://github.com/nwoltman/node-mysql-plus/commit/2f75c046e3af1fa6f674edbe3f136a791dd86ed7))
+ PoolPlus: Implement a `.transaction()` method ([`ee352a1`](https://github.com/nwoltman/node-mysql-plus/commit/ee352a1ae1b71a0362a1c8ee4e839f55a8440ce7))
+ MySQLTable: Make methods return a promise if the callback is omitted ([`f7cf915`](https://github.com/nwoltman/node-mysql-plus/commit/f7cf9153720dff26d9d6d365b7b0715d7cc9e212))
+ Connection: Extend with the `.pquery()` method ([`6db49f9`](https://github.com/nwoltman/node-mysql-plus/commit/6db49f9b2947af022a9cf9e2e67d673d265ad4d9))
+ PoolPlus: Add `.pquery()` method ([`08e7ee8`](https://github.com/nwoltman/node-mysql-plus/commit/08e7ee89a3ff68b076fce4703a091b0d911a6f5c))
+ ColumnDefinition: Add `.oldName()` method ([`1e78383`](https://github.com/nwoltman/node-mysql-plus/commit/1e78383bca5d13afdc5c3afb73cae025a7ad278a))
+ ColumnDefinition: Add `.defaultRaw()` method ([`4dec938`](https://github.com/nwoltman/node-mysql-plus/commit/4dec9381ca03220dbb0152c7b65d5df2abb91521))
+ test: Fix COMPRESSION table option and add tests+coverage ([`78cb795`](https://github.com/nwoltman/node-mysql-plus/commit/78cb7956be18a88ae6c28f81543fa635b1980f0b))
+ ci: Test on Node.js v7 ([`5d67ba4`](https://github.com/nwoltman/node-mysql-plus/commit/5d67ba43bff9ce98ff835f67d2702c719d994d28))
+ ci: Test with MySQL 5.7 ([`5f42b10`](https://github.com/nwoltman/node-mysql-plus/commit/5f42b107133a277ed3e1db46230b05a2677eaf27))
+ lib: Prevent unnecessary ALTER TABLE operation when the collation is unchanged ([`b5ae554`](https://github.com/nwoltman/node-mysql-plus/commit/b5ae554244ea9831f04f5ab7b681c3f4afed3941))


## 0.3.0 (2016-05-28)

### Breaking Changes
+ MySQLTable: Don't escape the first argument to `.select()` if it is a string ([`025a584`](https://github.com/nwoltman/node-mysql-plus/commit/025a584e04e2b2794d2d19265ad814ace8874f3b))
+ MySQLTable: Fix escaping bug in `.insert()` and `.update()` ([`a271b9d`](https://github.com/nwoltman/node-mysql-plus/commit/a271b9d2fb5589ec121d6b60a2091bf9bd12c60e))
  + This fix required the signature to `.update()` to be changed. Now the `data` argument is optional(ish) and can only be an object.
+ doc: Require all instances of the `values` argument in `MySQLTable` to be an Array ([`7cc7699`](https://github.com/nwoltman/node-mysql-plus/commit/7cc769942e184c5dd44b914724b61972266a7954))
  + Technically only a documentation change, but officially non-array values for the `values` argument are no longer supported and their use may cause undefined behaviour

### Other Changes
+ MySQLTable: Modify `.insert()` to allow for bulk inserts ([`72c5e59`](https://github.com/nwoltman/node-mysql-plus/commit/72c5e59a92be9dee1a20f42217d5eb360507cf29))
+ doc: Remove unnecessary notes about escaping user input ([`9fe3a2c`](https://github.com/nwoltman/node-mysql-plus/commit/9fe3a2c4025d7275adfcc56d476d1be6367ab285))
+ doc: Fix typo in `MySQLTable.insertIgnore()` example ([`e5328ff`](https://github.com/nwoltman/node-mysql-plus/commit/e5328ffb75b2bdc7accb7e8842335f5f6c136643))
+ MySQLTable: Fix argument handling bug in `.update()` ([`362ed2b`](https://github.com/nwoltman/node-mysql-plus/commit/362ed2bc252345c50ff6b756d7536e5609c9dcdd))


## 0.2.0 (2016-05-25)
+ lib: Require the m argument for varchar and varbinary ([`0564137`](https://github.com/nwoltman/node-mysql-plus/commit/0564137180f44ced3faf9ccfe6e18859e39bf59c))

## 0.1.4 (2016-05-25)
+ Prevent unnecessary charset and collation migrations ([`86cbd4d`](https://github.com/nwoltman/node-mysql-plus/commit/86cbd4db5e6a5dd1b91d01c5cd0b3bd03347d0f0))

## 0.1.3 (2016-05-07)
+ Test on Node v6 ([`4c482f6`](https://github.com/nwoltman/node-mysql-plus/commit/4c482f622173eacef28b3fbed95adca2b123ea21))
+ Documentation improvements and miscellaneous non-code fixes

## 0.1.2 (2016-02-26)
+ docs: Fix asterisk formatting ([`58abb89`](https://github.com/nwoltman/node-mysql-plus/commit/58abb89e717bfbc53b67028b046cc434259d461a))
+ docs: Fix links and formatting ([`95a9a13`](https://github.com/nwoltman/node-mysql-plus/commit/95a9a132b884b8f755f31afdec311b7a16e36ffa))

## 0.1.0 (2016-02-26)
Initial release
