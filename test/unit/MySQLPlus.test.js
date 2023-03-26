'use strict';

const ColumnDefinitions = require('../../lib/ColumnDefinitions');
const KeyDefinitions = require('../../lib/KeyDefinitions');
const MySQLPlus = require('../../lib/MySQLPlus');
const PoolPlus = require('../../lib/PoolPlus');

const mysql = require('mysql2');

describe('MySQLPlus', () => {

  it('should have all the same properties as the mysql module (except createPool is different)', () => {
    for (var property in mysql) {
      if (property === 'createPool') {
        MySQLPlus.createPool.should.not.equal(mysql.createPool);
      } else {
        MySQLPlus[property].should.equal(mysql[property]);
      }
    }
  });


  describe('.ColTypes', () => {

    it('should provide the ColumnDefinitions functions', () => {
      MySQLPlus.ColTypes.should.equal(ColumnDefinitions);
    });

  });


  describe('.KeyTypes', () => {

    it('should provide the KeyDefinitions functions', () => {
      MySQLPlus.KeyTypes.should.equal(KeyDefinitions);
    });

  });


  describe('.createPool()', () => {

    var pool;

    before(() => {
      pool = MySQLPlus.createPool({});
    });

    after((done) => {
      pool.end(done);
    });

    it('should return an instance of PoolPlus', () => {
      pool.should.be.an.instanceOf(PoolPlus);
    });

  });

});
