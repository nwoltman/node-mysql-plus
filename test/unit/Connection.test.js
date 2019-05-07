'use strict';

const config = require('../config');
const mysql = require('mysql');
const sinon = require('sinon');

describe('Connection', () => {

  const connection = mysql.createConnection(config);

  after(() => {
    connection.end();
  });

  describe('#pquery()', () => {

    it('should behave like #query() when passed a callback', () => {
      const expectedSql = 'SELECT 1 as ??';
      const expectedValues = ['solution'];

      function expectedCb() { /* no-op */ }

      sinon.stub(connection, 'query').callsFake((sql, values, cb) => {
        sql.should.equal(expectedSql);
        values.should.equal(expectedValues);
        cb.should.equal(expectedCb);
      });

      connection.pquery(expectedSql, expectedValues, expectedCb);
      connection.query.should.be.called();

      connection.query.restore();
    });

    it('should return a working Promise', (done) => {
      connection.pquery('SELECT "a" as solution')
        .then((results) => {
          results.should.have.length(1);
          results[0].solution.should.equal('a');

          connection.pquery('SELECT "a" as ??', ['solution'])
            .then((results2) => {
              results2.should.have.length(1);
              results2[0].solution.should.equal('a');

              connection.pquery('SELECT a as solution')
                .then(() => done(new Error()))
                .catch(() => done());
            })
            .catch(done);
        })
        .catch(done);
    });

  });

});
