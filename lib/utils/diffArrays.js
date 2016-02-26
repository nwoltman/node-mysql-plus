/**
 * diffArray
 *
 * A function that compares two arrays and finds the items
 * that have been added/removed from the first array.
 */

'use strict';

const arrayEqual = require('array-equal');

function diffArrays(original, current) {
  return {
    removedItems: getNewItems(current, original),
    addedItems: getNewItems(original, current),
  };
}

function getNewItems(arr1, arr2) {
  const newItems = [];

  for (var i = 0; i < arr2.length; i++) {
    const item = arr2[i];
    if (item instanceof Array && containsArray(arr1, item)) {
      continue;
    }
    if (arr1.indexOf(item) >= 0) {
      continue;
    }
    newItems.push(item);
  }

  return newItems;
}

function containsArray(haystack, needleArray) {
  for (var i = 0; i < haystack.length; i++) {
    const item = haystack[i];
    if (item instanceof Array && arrayEqual(item, needleArray)) {
      return true;
    }
  }
  return false;
}

module.exports = diffArrays;
