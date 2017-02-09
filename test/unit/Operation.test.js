'use strict';

const Operation = require('../../lib/Operation');

describe('Operation', () => {

  describe('.create()', () => {

    it('should create an Operation object', () => {
      Operation.create(
        Operation.Types.ADD_COLUMN,
        'some SQL'
      ).should.deepEqual({
        type: Operation.Types.ADD_COLUMN,
        sql: 'some SQL',
        columns: undefined,
      });

      Operation.create(
        Operation.Types.MODIFY_TABLE_OPTIONS,
        'SQL',
        ['column', 'names']
      ).should.deepEqual({
        type: Operation.Types.MODIFY_TABLE_OPTIONS,
        sql: 'SQL',
        columns: ['column', 'names'],
      });
    });

  });

});
