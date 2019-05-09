'use strict';

const parseKeyParts = require('../../lib/utils/parseKeyParts');
const should = require('should');

describe('parseKeyParts', () => {

  it('should parse key parts', () => {
    parseKeyParts(['id']).should.deepEqual({
      columnNames: ['id'],
      formattedKeyParts: ['`id`'],
    });

    parseKeyParts(['id', 'name(5)']).should.deepEqual({
      columnNames: ['id', 'name'],
      formattedKeyParts: ['`id`', '`name`(5)'],
    });
  });

  it('should throw if passed invalid key parts', () => {
    should.throws(() => parseKeyParts(['(nope)']), /Invalid key part/);
  });

});
