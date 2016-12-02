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
  const tableSQL = `
    CREATE TABLE \`mysql_table_test_table\` (
      \`id\` BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`letter\` CHAR(1)
    )
  `;

  before(done => {
    pool.query(tableSQL, err => {
      if (err) throw err;
      const insertSQL = 'INSERT INTO `mysql_table_test_table` (`email`) VALUES ' +
        "('one@email.com'), ('two@email.com'), ('three@email.com')";
      pool.query(insertSQL, done);
    });
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


  describe('#select()', () => {

    it('should be able to select all data from the table', done => {
      testTable.select('*', (err, rows) => {
        if (err) throw err;
        rows.length.should.equal(3);
        done();
      });
    });

    it('should be able to select certain columns of data from the table', done => {
      testTable.select('email', (err, rows) => {
        if (err) throw err;
        rows.length.should.equal(3);
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
        rows.length.should.equal(2);
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
        rows.length.should.equal(2);
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


  describe('#insert()', () => {

    it('should insert the specified data into the table', done => {
      testTable.insert({email: 'four@email.com'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.insertId.should.equal(4);
        done();
      });
    });

    it('should insert the specified data into the table with an ON DUPLICATE KEY UPDATE clause', done => {
      const data = {id: 4, email: 'four@email.com'};
      const onDuplicateKey = "ON DUPLICATE KEY UPDATE `email` = 'four2@email.com'";
      testTable.insert(data, onDuplicateKey, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(2); // Updated rows are affected twice
        result.insertId.should.equal(4);
        done();
      });
    });

    it('should insert data with question marks into the table when using the `sqlString` and `values` parameters', done => {
      const data = {id: 4, email: '??four?@email.com'};
      const onDuplicateKey = 'ON DUPLICATE KEY UPDATE ?? = ?';
      testTable.insert(data, onDuplicateKey, ['email', 'four3@email.com'], (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(2); // Updated rows are affected twice
        result.insertId.should.equal(4);
        done();
      });
    });

    it('should be able to perform bulk inserts', done => {
      const data = [
        [5, 'five@email.com', null],
        [6, 'six@email.com', null],
      ];
      testTable.insert([data], (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(2);
        done();
      });
    });

    it('should be able to perform bulk inserts with specified columns', done => {
      const data = [
        [null, 'seven@email.com'],
        [null, 'eigth@email.com'],
      ];
      testTable.insert([['letter', 'email'], data], (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(2);
        done();
      });
    });

  });


  describe('#insertIgnore()', () => {

    it('should insert the specified data into the table', done => {
      testTable.insertIgnore({email: 'nine@email.com'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.insertId.should.equal(9);
        done();
      });
    });

    it('should not result in an error if attempting to insert a duplicate key', done => {
      testTable.insertIgnore({email: 'nine@email.com'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(0);
        done();
      });
    });

  });


  describe('#replace()', () => {

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

    it('should be able to update all rows in the table with only the `data` argument', done => {
      testTable.update({letter: '?'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(9);
        result.changedRows.should.equal(9);
        done();
      });
    });

    it('should be able to update all rows in the table with only the `sqlString` argument', done => {
      testTable.update("`email` = CONCAT('updated_', `email`)", (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(9);
        result.changedRows.should.equal(9);
        done();
      });
    });

    it('should be able to update specific rows in the table', done => {
      testTable.update({email: 'updated@email.com'}, 'WHERE `id` = 5', (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.changedRows.should.equal(1);
        done();
      });
    });

    it('should be able to update rows using SQL formatted with placeholders', done => {
      testTable.update({email: 'updated2@email.com'}, 'WHERE `id` = ?', [5], (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.changedRows.should.equal(1);
        done();
      });
    });

    it('should accept the `sqlString` argument without using the `data` argument', done => {
      testTable.update("`email` = 'updated3@email.com' WHERE `id` = ?", [5], (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.changedRows.should.equal(1);
        done();
      });
    });

    it('should accept the `sqlString` argument without the `data` or `values` arguments', done => {
      testTable.update("`email` = 'updated4@email.com' WHERE `id` = 5", (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.changedRows.should.equal(1);
        done();
      });
    });

    it('should work with `data` objects that contain question marks', done => {
      testTable.update({email: 'updated?@email.com'}, 'WHERE `id` = ?', [5], (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.changedRows.should.equal(1);
        done();
      });
    });

  });


  describe('#delete()', () => {

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


  describe('#query()', () => {

    before(() => {
      sinon.spy(pool, 'query');
    });

    after(() => {
      pool.query.restore();
    });

    it('should just directly call the pool\'s query() function', done => {
      testTable.query('SELECT 1 + 1 AS solution', function callback(err, rows) {
        if (err) throw err;
        rows.length.should.equal(1);
        rows[0].solution.should.equal(2);
        pool.query.should.be.calledOnce().and.be.calledWithExactly('SELECT 1 + 1 AS solution', callback);
        done();
      });
    });

  });

});
