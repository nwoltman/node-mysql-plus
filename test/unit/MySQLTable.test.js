'use strict';

const MySQLTable = require('../../lib/MySQLTable');
const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');
const should = require('should');
const sinon = require('sinon');

should.config.checkProtoEql = false;

describe('MySQLTable', () => {

  const pool = MySQLPlus.createPool(config);

  const mockTableSchema = {};
  const testTable = new MySQLTable('mysql_table_test_table', mockTableSchema, pool);

  function resetTable(cb) {
    testTable.delete(err => {
      if (err) throw err;
      pool.query('ALTER TABLE `mysql_table_test_table` AUTO_INCREMENT=1', cb);
    });
  }

  before(done => {
    pool.query(`
      CREATE TABLE \`mysql_table_test_table\` (
        \`id\` BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`letter\` CHAR(1)
      )
    `, done);
  });

  after(done => {
    pool.end(done);
  });


  describe('#tableName', () => { // TODO: Remove after v0.4.0 is released

    it('should be the name of the table', () => {
      testTable.tableName.should.equal('mysql_table_test_table');
    });

  });


  describe('#name', () => {

    it('should be the name of the table', () => {
      testTable.name.should.equal('mysql_table_test_table');
    });

  });


  describe('#schema', () => {

    it('should be the original table schema', () => {
      testTable.schema.should.equal(mockTableSchema);
    });

  });


  describe('#pool', () => {

    it('should be the pool that was passed to the constructor', () => {
      testTable.pool.should.equal(pool);
    });

  });


  describe('#trxn', () => {


    it('should be undefined if not passed to the constructor', () => {
      should(testTable.trxn).be.undefined();
    });


    it('should be the transaction connection that was passed to the constructor', () => {
      return pool.transaction((trxn, done) => {
        const trxnTable = new MySQLTable('mysql_table_test_table', mockTableSchema, pool, trxn);
        trxnTable.trxn.should.equal(trxn);
        done();
      });
    });

  });


  describe('#select()', () => {

    before(done => {
      const insertSQL = 'INSERT INTO `mysql_table_test_table` (`email`) VALUES ' +
        "('one@email.com'), ('two@email.com'), ('three@email.com')";
      testTable.query(insertSQL, done);
    });

    after(resetTable);

    describe('with a callback', () => {

      it('should be able to select all data from the table', done => {
        testTable.select('*', (err, rows) => {
          if (err) throw err;
          rows.should.have.length(3);
          done();
        });
      });

      it('should be able to select certain columns of data from the table', done => {
        testTable.select('email', (err, rows) => {
          if (err) throw err;
          rows.should.have.length(3);
          rows.forEach(row => {
            row.should.not.have.property('id');
            row.should.have.property('email');
          });
          done();
        });
      });

      it('should be able to select specific columns and rows from the table', done => {
        testTable.select(['id', 'email'], 'WHERE `id` > 1 ORDER BY `id`', (err, rows) => {
          if (err) throw err;
          rows.should.have.length(2);
          rows[0].id.should.equal(2);
          rows[0].email.should.equal('two@email.com');
          rows[1].id.should.equal(3);
          rows[1].email.should.equal('three@email.com');
          done();
        });
      });

      it('should be able to use SQL formatted with placeholders', done => {
        testTable.select('??', 'WHERE ?? > ? ORDER BY ??', [['id', 'email'], 'id', 1, 'id'], (err, rows) => {
          if (err) throw err;
          rows.should.have.length(2);
          rows[0].id.should.equal(2);
          rows[0].email.should.equal('two@email.com');
          rows[1].id.should.equal(3);
          rows[1].email.should.equal('three@email.com');
          done();
        });
      });

      it('should be able to select columns using aliases', done => {
        testTable.select('`id`, `email` AS `eml`', 'WHERE `id` = 1', (err, rows) => {
          if (err) throw err;
          rows.should.deepEqual([{id: 1, eml: 'one@email.com'}]);
          done();
        });
      });

      it('should be able to select using a function', done => {
        testTable.select('COUNT(*) AS `everyoneElse`', 'WHERE `id` <> 1', (err, rows) => {
          if (err) throw err;
          rows.should.deepEqual([{everyoneElse: 2}]);
          done();
        });
      });

    });


    describe('with a promise', () => {

      it('should be able to select all data from the table', () => {
        return testTable.select('*')
          .then(rows => {
            rows.should.have.length(3);
          });
      });

      it('should be able to select certain columns of data from the table', () => {
        return testTable.select('email')
          .then(rows => {
            rows.should.have.length(3);
            rows.forEach(row => {
              row.should.not.have.property('id');
              row.should.have.property('email');
            });
          });
      });

      it('should be able to select specific columns and rows from the table', () => {
        return testTable.select(['id', 'email'], 'WHERE `id` > 1 ORDER BY `id`')
          .then(rows => {
            rows.should.have.length(2);
            rows[0].id.should.equal(2);
            rows[0].email.should.equal('two@email.com');
            rows[1].id.should.equal(3);
            rows[1].email.should.equal('three@email.com');
          });
      });

      it('should be able to use SQL formatted with placeholders', () => {
        return testTable.select('??', 'WHERE ?? > ? ORDER BY ??', [['id', 'email'], 'id', 1, 'id'])
          .then(rows => {
            rows.should.have.length(2);
            rows[0].id.should.equal(2);
            rows[0].email.should.equal('two@email.com');
            rows[1].id.should.equal(3);
            rows[1].email.should.equal('three@email.com');
          });
      });

      it('should be able to select columns using aliases', () => {
        return testTable.select('`id`, `email` AS `eml`', 'WHERE `id` = 1')
          .then(rows => {
            rows.should.deepEqual([{id: 1, eml: 'one@email.com'}]);
          });
      });

      it('should be able to select using a function', () => {
        return testTable.select('COUNT(*) AS `everyoneElse`', 'WHERE `id` <> 1')
          .then(rows => {
            rows.should.deepEqual([{everyoneElse: 2}]);
          });
      });

    });

  });


  describe('#insert()', () => {

    describe('with a callback', () => {

      after(resetTable);

      it('should insert the specified data into the table', done => {
        testTable.insert({email: 'one@email.com'}, (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(1);
          result.insertId.should.equal(1);
          done();
        });
      });

      it('should insert the specified data into the table with an ON DUPLICATE KEY UPDATE clause', done => {
        const data = {id: 1, email: 'one@email.com'};
        const onDuplicateKey = "ON DUPLICATE KEY UPDATE `email` = 'one2@email.com'";
        testTable.insert(data, onDuplicateKey, (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(2); // Updated rows are affected twice
          result.insertId.should.equal(1);
          done();
        });
      });

      it('should insert data with question marks into the table when using the `sqlString` and `values` parameters', done => {
        const data = {id: 1, email: '??one?@email.com'};
        const onDuplicateKey = 'ON DUPLICATE KEY UPDATE ?? = ?';
        testTable.insert(data, onDuplicateKey, ['email', 'one3@email.com'], (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(2); // Updated rows are affected twice
          result.insertId.should.equal(1);
          done();
        });
      });

      it('should be able to perform bulk inserts', done => {
        const data = [
          [2, 'two@email.com', null],
          [3, 'three@email.com', null],
        ];
        testTable.insert([data], (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(2);
          done();
        });
      });

      it('should be able to perform bulk inserts with specified columns', done => {
        const data = [
          [null, 'four@email.com'],
          [null, 'five@email.com'],
        ];
        testTable.insert([['letter', 'email'], data], (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(2);
          done();
        });
      });

    });


    describe('with a promise', () => {

      after(resetTable);

      it('should insert the specified data into the table', () => {
        return testTable.insert({email: 'one@email.com'})
          .then(result => {
            result.affectedRows.should.equal(1);
            result.insertId.should.equal(1);
          });
      });

      it('should insert the specified data into the table with an ON DUPLICATE KEY UPDATE clause', () => {
        const data = {id: 1, email: 'one@email.com'};
        const onDuplicateKey = "ON DUPLICATE KEY UPDATE `email` = 'one2@email.com'";

        return testTable.insert(data, onDuplicateKey)
          .then(result => {
            result.affectedRows.should.equal(2); // Updated rows are affected twice
            result.insertId.should.equal(1);
          });
      });

      it('should insert data with question marks into the table when using the `sqlString` and `values` parameters', () => {
        const data = {id: 1, email: '??one?@email.com'};
        const onDuplicateKey = 'ON DUPLICATE KEY UPDATE ?? = ?';

        return testTable.insert(data, onDuplicateKey, ['email', 'one3@email.com'])
          .then(result => {
            result.affectedRows.should.equal(2); // Updated rows are affected twice
            result.insertId.should.equal(1);
          });
      });

      it('should be able to perform bulk inserts', () => {
        const data = [
          [2, 'two@email.com', null],
          [3, 'three@email.com', null],
        ];

        return testTable.insert([data])
          .then(result => {
            result.affectedRows.should.equal(2);
          });
      });

      it('should be able to perform bulk inserts with specified columns', () => {
        const data = [
          [null, 'four@email.com'],
          [null, 'five@email.com'],
        ];

        return testTable.insert([['letter', 'email'], data])
          .then(result => {
            result.affectedRows.should.equal(2);
          });
      });

    });

  });


  describe('#insertIgnore()', () => {

    after(resetTable);

    it('should insert the specified data into the table', done => {
      testTable.insertIgnore({email: 'one@email.com'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.insertId.should.equal(1);
        done();
      });
    });

    it('should not result in an error if attempting to insert a duplicate key', done => {
      testTable.insertIgnore({email: 'one@email.com'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(0);
        done();
      });
    });

  });


  describe('#replace()', () => {

    after(resetTable);

    it('should insert the specified data into the table', done => {
      testTable.replace({email: 'one@email.com'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.insertId.should.equal(1);
        done();
      });
    });

    it('should replace the existing row in the table', done => {
      testTable.replace({id: 1, email: 'newone@email.com'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(2); // delete + insert
        result.insertId.should.equal(1);
        done();
      });
    });

  });


  describe('#update()', () => {

    describe('with a callback', () => {

      before(done => {
        const insertSQL = 'INSERT INTO `mysql_table_test_table` (`email`) VALUES ' +
          "('one@email.com'), ('two@email.com'), ('three@email.com')";
        testTable.query(insertSQL, done);
      });

      after(resetTable);

      it('should be able to update all rows in the table with only the `data` argument', done => {
        testTable.update({letter: '?'}, (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(3);
          result.changedRows.should.equal(3);
          done();
        });
      });

      it('should be able to update all rows in the table with only the `sqlString` argument', done => {
        testTable.update("`email` = CONCAT('updated_', `email`)", (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(3);
          result.changedRows.should.equal(3);
          done();
        });
      });

      it('should be able to update specific rows in the table', done => {
        testTable.update({email: 'updated@email.com'}, 'WHERE `id` = 3', (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(1);
          result.changedRows.should.equal(1);
          done();
        });
      });

      it('should be able to update rows using SQL formatted with placeholders', done => {
        testTable.update({email: 'updated2@email.com'}, 'WHERE `id` = ?', [3], (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(1);
          result.changedRows.should.equal(1);
          done();
        });
      });

      it('should accept the `sqlString` argument without using the `data` argument', done => {
        testTable.update("`email` = 'updated3@email.com' WHERE `id` = ?", [3], (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(1);
          result.changedRows.should.equal(1);
          done();
        });
      });

      it('should accept the `sqlString` argument without the `data` or `values` arguments', done => {
        testTable.update("`email` = 'updated4@email.com' WHERE `id` = 3", (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(1);
          result.changedRows.should.equal(1);
          done();
        });
      });

      it('should work with `data` objects that contain question marks', done => {
        testTable.update({email: 'updated?@email.com'}, 'WHERE `id` = ?', [3], (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(1);
          result.changedRows.should.equal(1);
          done();
        });
      });

    });


    describe('with a promise', () => {

      before(done => {
        const insertSQL = 'INSERT INTO `mysql_table_test_table` (`email`) VALUES ' +
          "('one@email.com'), ('two@email.com'), ('three@email.com')";
        testTable.query(insertSQL, done);
      });

      after(resetTable);

      it('should be able to update all rows in the table with only the `data` argument', () => {
        return testTable.update({letter: '?'})
          .then(result => {
            result.affectedRows.should.equal(3);
            result.changedRows.should.equal(3);
          });
      });

      it('should be able to update all rows in the table with only the `sqlString` argument', () => {
        return testTable.update("`email` = CONCAT('updated_', `email`)")
          .then(result => {
            result.affectedRows.should.equal(3);
            result.changedRows.should.equal(3);
          });
      });

      it('should be able to update specific rows in the table', () => {
        return testTable.update({email: 'updated@email.com'}, 'WHERE `id` = 3')
          .then(result => {
            result.affectedRows.should.equal(1);
            result.changedRows.should.equal(1);
          });
      });

      it('should be able to update rows using SQL formatted with placeholders', () => {
        return testTable.update({email: 'updated2@email.com'}, 'WHERE `id` = ?', [3])
          .then(result => {
            result.affectedRows.should.equal(1);
            result.changedRows.should.equal(1);
          });
      });

      it('should accept the `sqlString` argument without using the `data` argument', () => {
        return testTable.update("`email` = 'updated3@email.com' WHERE `id` = ?", [3])
          .then(result => {
            result.affectedRows.should.equal(1);
            result.changedRows.should.equal(1);
          });
      });

      it('should accept the `sqlString` argument without the `data` or `values` arguments', () => {
        return testTable.update("`email` = 'updated4@email.com' WHERE `id` = 3")
          .then(result => {
            result.affectedRows.should.equal(1);
            result.changedRows.should.equal(1);
          });
      });

      it('should work with `data` objects that contain question marks', () => {
        return testTable.update({email: 'updated?@email.com'}, 'WHERE `id` = ?', [3])
          .then(result => {
            result.affectedRows.should.equal(1);
            result.changedRows.should.equal(1);
          });
      });

    });

  });


  describe('#delete()', () => {

    describe('with a callback', () => {

      before(done => {
        const insertSQL = 'INSERT INTO `mysql_table_test_table` (`email`) VALUES ' +
          "('one@email.com'), ('two@email.com'), ('three@email.com'), ('four@email.com'), ('five@email.com')," +
          "('six@email.com'), ('seven@email.com'), ('eight@email.com'), ('nine@email.com')";
        testTable.query(insertSQL, done);
      });

      after(resetTable);

      it('should delete specific rows from the table', done => {
        testTable.delete('WHERE `id` > 3', (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(6);
          done();
        });
      });

      it('should delete rows using SQL formatted with placeholders', done => {
        testTable.delete('WHERE ?? > ?', ['id', 2], (err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(1);
          done();
        });
      });

      it('should delete all rows from the table', done => {
        testTable.delete((err, result) => {
          if (err) throw err;
          result.affectedRows.should.equal(2);
          done();
        });
      });

    });


    describe('with a promise', () => {

      before(done => {
        const insertSQL = 'INSERT INTO `mysql_table_test_table` (`email`) VALUES ' +
          "('one@email.com'), ('two@email.com'), ('three@email.com'), ('four@email.com'), ('five@email.com')," +
          "('six@email.com'), ('seven@email.com'), ('eight@email.com'), ('nine@email.com')";
        testTable.query(insertSQL, done);
      });

      after(resetTable);

      it('should delete specific rows from the table', () => {
        return testTable.delete('WHERE `id` > 3')
          .then(result => {
            result.affectedRows.should.equal(6);
          });
      });

      it('should delete rows using SQL formatted with placeholders', () => {
        return testTable.delete('WHERE ?? > ?', ['id', 2])
          .then(result => {
            result.affectedRows.should.equal(1);
          });
      });

      it('should delete all rows from the table', () => {
        return testTable.delete()
          .then(result => {
            result.affectedRows.should.equal(2);
          });
      });

    });

  });


  describe('#query()', () => {

    beforeEach(() => {
      sinon.spy(pool, 'pquery');
    });

    afterEach(() => {
      pool.pquery.restore();
    });

    it('should just directly call the pool\'s pquery() function', done => {
      testTable.query('SELECT 1 + 1 AS solution', function callback(err, rows) {
        if (err) throw err;
        rows.should.have.length(1);
        rows[0].solution.should.equal(2);
        pool.pquery.should.be.calledOnce().and.be.calledWith('SELECT 1 + 1 AS solution', callback);
        done();
      });
    });

    it('should return a promise if the callback is omitted', () => {
      return testTable.query('SELECT 1 + 1 AS solution')
        .then(rows => {
          rows.should.have.length(1);
          rows[0].solution.should.equal(2);
          pool.pquery.should.be.calledOnce().and.be.calledWith('SELECT 1 + 1 AS solution');
        });
    });

  });


  describe('#transacting()', () => {

    after(resetTable);

    it('should return a new MySQLTable instance that is almost identical to the original', () => {
      return pool.transaction((trxn, done) => {
        const trxnTestTable = testTable.transacting(trxn);
        trxnTestTable.name.should.equal(testTable.name);
        trxnTestTable.schema.should.equal(testTable.schema);
        trxnTestTable.pool.should.equal(testTable.pool);
        trxnTestTable.trxn.should.equal(trxn);
        done();
      });
    });

    it('should create a new MySQLTable instance that makes queries using the provided transaction connection', () => {
      const goodError = new Error('Good error');

      return pool.transaction(trxn => {
        const trxnTestTable = testTable.transacting(trxn);

        return trxnTestTable.insert({email: 'transacting@email.com'})
          .then(result => trxnTestTable.insert({email: 'meh', letter: result.insertId}))
          .then(() => trxnTestTable.select('*'))
          .then(rows => {
            rows.should.have.length(2);
            rows[0].id.should.equal(1);
            rows[0].email.should.equal('transacting@email.com');
            rows[1].id.should.equal(2);
            rows[1].email.should.equal('meh');
            rows[1].letter.should.equal('1');

            throw goodError;
          });
      }).then(() => {
        throw new Error('Bad error');
      }).catch(err => {
        err.should.equal(goodError);
        return testTable.select('*')
          .then(rows => {
            rows.should.be.empty();
          });
      });
    });

  });

});
