# CHANGELOG

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
