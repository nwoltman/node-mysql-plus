# CHANGELOG

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
