'use strict';

const diffKeys = require('../../lib/utils/diffKeys');

describe('diffKeys()', () => {

  it('should return an object with keys added to and keys removed from the original key definition', () => {
    diffKeys([1, 2, 3], [1, 3, 4, 5]).should.deepEqual({
      addedKeys: [4, 5],
      removedKeys: [2],
    });

    diffKeys([1, 2, 3], [1, 2, 3]).should.deepEqual({
      addedKeys: [],
      removedKeys: [],
    });

    diffKeys([1, 2, 3, [4]], [1, 2, 3, [4]]).should.deepEqual({
      addedKeys: [],
      removedKeys: [],
    });

    diffKeys([1, 2, 3], [2, 3, 1]).should.deepEqual({
      addedKeys: [],
      removedKeys: [],
    });

    diffKeys([1, 2], [3, 4, 5, 6]).should.deepEqual({
      addedKeys: [3, 4, 5, 6],
      removedKeys: [1, 2],
    });

    diffKeys([1, [10, 11], 2, 3], [1, [10, 11], 3, 4, 5]).should.deepEqual({
      addedKeys: [4, 5],
      removedKeys: [2],
    });

    diffKeys([1, [11, 12]], [[11], 3, 4, 5, 6]).should.deepEqual({
      addedKeys: [[11], 3, 4, 5, 6],
      removedKeys: [1, [11, 12]],
    });

    const keys = [1, 2, 3, [4]];
    diffKeys(keys, keys).should.deepEqual({
      addedKeys: [],
      removedKeys: [],
    });

  });

});
