'use strict';

const diffArrays = require('../../lib/utils/diffArrays');

describe('diffArrays()', () => {

  it('should return an object with items added to and items removed from the original array', () => {
    diffArrays([1, 2, 3], [1, 3, 4, 5]).should.deepEqual({
      removedItems: [2],
      addedItems: [4, 5],
    });

    diffArrays([1, 2, 3], [1, 2, 3]).should.deepEqual({
      removedItems: [],
      addedItems: [],
    });

    diffArrays([1, 2, 3], [2, 3, 1]).should.deepEqual({
      removedItems: [],
      addedItems: [],
    });

    diffArrays([1, 2], [3, 4, 5, 6]).should.deepEqual({
      removedItems: [1, 2],
      addedItems: [3, 4, 5, 6],
    });

    diffArrays([1, [10, 11], 2, 3], [1, [10, 11], 3, 4, 5]).should.deepEqual({
      removedItems: [2],
      addedItems: [4, 5],
    });

    diffArrays([1, [11, 12]], [[11], 3, 4, 5, 6]).should.deepEqual({
      removedItems: [1, [11, 12]],
      addedItems: [[11], 3, 4, 5, 6],
    });
  });

});
