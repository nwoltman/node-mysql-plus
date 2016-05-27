'use strict';

const MySQLTable = require('../../lib/MySQLTable');
const MySQLPlus = require('../../lib/MySQLPlus');

const config = require('../config');
const sinon = require('sinon');

describe('MySQLTable', () => {

  const pool = MySQLPlus.createPool(config);

  const mockTableSchema = {};
  const testTable = new MySQLTable('mysql_table_test_table', mockTableSchema, pool);
  const tableSQL = `
    CREATE TABLE \`mysql_table_test_table\` (
      \`id\` BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
      \`email\` VARCHAR(255) NOT NULL UNIQUE
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


  describe('#tableName', () => {

    it('should be the name of the table', () => {
      testTable.tableName.should.equal('mysql_table_test_table');
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
      testTable.select('*', (err, results) => {
        if (err) throw err;
        results.length.should.equal(3);
        done();
      });
    });

    it('should be able to select certain columns of data from the table', done => {
      testTable.select('email', (err, results) => {
        if (err) throw err;
        results.length.should.equal(3);
        results.forEach(result => {
          result.should.not.have.property('id');
          result.should.have.property('email');
        });
        done();
      });
    });

    it('should be able to select specific rows from the table', done => {
      testTable.select('*', 'WHERE `id` > 1 ORDER BY `id`', (err, results) => {
        if (err) throw err;
        results.length.should.equal(2);
        results[0].id.should.equal(2);
        results[0].email.should.equal('two@email.com');
        results[1].id.should.equal(3);
        results[1].email.should.equal('three@email.com');
        done();
      });
    });

    it('should be able to use SQL formatted with placeholders', done => {
      testTable.select('*', 'WHERE ?? > ? ORDER BY ??', ['id', 1, 'id'], (err, results) => {
        if (err) throw err;
        results.length.should.equal(2);
        results[0].id.should.equal(2);
        results[0].email.should.equal('two@email.com');
        results[1].id.should.equal(3);
        results[1].email.should.equal('three@email.com');
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
      const onDuplicateKey = 'ON DUPLICATE KEY UPDATE `email` = ?';
      testTable.insert(data, onDuplicateKey, 'four2@email.com', (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(2); // Updated rows are affected twice
        result.insertId.should.equal(4);
        done();
      });
    });

  });


  describe('#insertIgnore()', () => {

    it('should insert the specified data into the table', done => {
      testTable.insertIgnore({email: 'five@email.com'}, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.insertId.should.equal(5);
        done();
      });
    });

    it('should not result in an error if attempting to insert a duplicate key', done => {
      testTable.insertIgnore({email: 'five@email.com'}, (err, result) => {
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

    it('should be able to update all rows in the table', done => {
      testTable.update("`email` = CONCAT('updated_', `email`)", (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(5);
        result.changedRows.should.equal(5);
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
      testTable.update({email: 'updated2@email.com'}, 'WHERE `id` = ?', 5, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.changedRows.should.equal(1);
        done();
      });
    });

    it('should accept a string for the `data` parameter', done => {
      testTable.update("`email` = 'updated3@email.com'", 'WHERE `id` = ?', 5, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.changedRows.should.equal(1);
        done();
      });
    });

    it('should accept a string for the `data` parameter without using the `sqlString` parameter', done => {
      testTable.update("`email` = 'updated4@email.com' WHERE `id` = ?", 5, (err, result) => {
        if (err) throw err;
        result.affectedRows.should.equal(1);
        result.changedRows.should.equal(1);
        done();
      });
    });

    it('should accept a string for the `data` parameter without using the `sqlString` or `values` parameters', done => {
      testTable.update("`email` = 'updated5@email.com' WHERE `id` = 5", (err, result) => {
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
        result.affectedRows.should.equal(2);
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
