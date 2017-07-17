'use strict';

const isKeyEqual = require('../../lib/utils/isKeyEqual');

describe('isKeyEqual()', () => {

  it('should compare the equality of key definitions', () => {
    isKeyEqual(null, null).should.be.true();
    isKeyEqual(null, undefined).should.be.true();
    isKeyEqual(undefined, null).should.be.true();
    isKeyEqual(undefined, undefined).should.be.true();

    isKeyEqual('a', 'a').should.be.true();
    isKeyEqual(['a'], ['a']).should.be.true();
    isKeyEqual(['a', 'b'], ['a', 'b']).should.be.true();

    isKeyEqual({
      table: 'user',
      column: 'id',
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    }, {
      table: 'user',
      column: 'id',
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    }).should.be.true();

    isKeyEqual({
      table: 'user',
      column: 'id',
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    }, {
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      table: 'user',
      column: 'id',
    }).should.be.true();

    isKeyEqual({
      table: 'thing_table',
      column: ['one', 'two'],
    }, {
      table: 'thing_table',
      column: ['one', 'two'],
    }).should.be.true();

    isKeyEqual({
      table: 'user',
      column: 'id',
    }, {
      table: 'user',
      column: 'id',
      undefCol: undefined,
    }).should.be.true();

    isKeyEqual({
      table: 'user',
      column: 'id',
      randomVal: true,
    }, {
      table: 'user',
      column: 'id',
    }).should.be.true();

    isKeyEqual('a', null).should.be.false();
    isKeyEqual(null, 'b').should.be.false();
    isKeyEqual('a', 'b').should.be.false();

    isKeyEqual(['a'], null).should.be.false();
    isKeyEqual(null, ['b']).should.be.false();
    isKeyEqual(['a'], 'a').should.be.false();
    isKeyEqual('b', ['b']).should.be.false();
    isKeyEqual(['a'], ['b']).should.be.false();
    isKeyEqual(['a', 'b'], ['b']).should.be.false();
    isKeyEqual(['b'], ['a', 'b']).should.be.false();
    isKeyEqual(['a', 'b'], ['b', 'a']).should.be.false();
    isKeyEqual(['b', 'a'], ['a', 'b']).should.be.false();

    isKeyEqual(
      {
        table: 'user',
        column: 'id',
        onDelete: 'CASCADE',
      },
      null
    ).should.be.false();

    isKeyEqual(
      null,
      {
        table: 'user',
        column: 'id',
        onDelete: 'CASCADE',
      }
    ).should.be.false();

    isKeyEqual(
      {
        table: 'user',
        column: 'id',
        onDelete: 'CASCADE',
      },
      'user.id'
    ).should.be.false();

    isKeyEqual(
      'user.id',
      {
        table: 'user',
        column: 'id',
        onDelete: 'CASCADE',
      }
    ).should.be.false();

    isKeyEqual({
      table: 'user',
      column: 'id',
    }, {
      table: 'person',
      column: 'id',
    }).should.be.false();

    isKeyEqual({
      table: 'user',
      column: 'id',
      onDelete: 'CASCADE',
    }, {
      onDelete: 'RESTRICT',
      table: 'user',
      column: 'id',
    }).should.be.false();

    isKeyEqual({
      table: 'user',
      column: 'id',
      onUpdate: 'CASCADE',
    }, {
      onUpdate: 'RESTRICT',
      table: 'user',
      column: 'id',
    }).should.be.false();

    isKeyEqual({
      table: 'user',
      column: 'id',
    }, {
      table: 'user',
      column: 'name',
    }).should.be.false();

    isKeyEqual({
      table: 'thing_table',
      column: 'id',
    }, {
      table: 'thing_table',
      column: ['one', 'two'],
    }).should.be.false();

    isKeyEqual({
      table: 'thing_table',
      column: ['one', 'two'],
    }, {
      table: 'thing_table',
      column: 'id',
    }).should.be.false();

    isKeyEqual({
      table: 'thing_table',
      column: ['one', 'two'],
    }, {
      table: 'thing_table',
      column: ['two', 'one'],
    }).should.be.false();

    isKeyEqual({
      table: 'user',
      column: 'id',
    }, {
      table: 'user',
    }).should.be.false();

    isKeyEqual({
      table: 'user',
    }, {
      table: 'user',
      column: 'id',
    }).should.be.false();

  });

});
