# CHANGELOG

## 0.3.0 (2016-05-28)

#### Breaking Changes
+ MySQLTable: Don't escape the first argument to `.select()` if it is a string ([`025a584`](https://github.com/nwoltman/node-mysql-plus/commit/025a584e04e2b2794d2d19265ad814ace8874f3b))
+ MySQLTable: Fix escaping bug in `.insert()` and `.update()` ([`a271b9d`](https://github.com/nwoltman/node-mysql-plus/commit/a271b9d2fb5589ec121d6b60a2091bf9bd12c60e))
  + This fix required the signature to `.update()` to be changed. Now the `data` argument is optional(ish) and can only be an object.
+ doc: Require all instances of the `values` argument in `MySQLTable` to be an Array ([`7cc7699`](https://github.com/nwoltman/node-mysql-plus/commit/7cc769942e184c5dd44b914724b61972266a7954))
  + Technically only a documentation change, but officially non-array values for the `values` argument are no longer supported and their use may cause undefined behaviour 

#### Other Changes
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
