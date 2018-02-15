/**
 * diffKeys
 *
 * A function that compares two key definitions and finds the keys
 * that have been added/removed from the first definition.
 */

'use strict';

function diffKeys(original, current) {
  if (original === undefined || original === null) {
    return {
      addedKeys: current === undefined || current === null
        ? []
        : current.slice(),
      removedKeys: [],
    };
  }
  if (current === undefined || current === null) {
    return {
      addedKeys: [],
      removedKeys: original.slice(),
    };
  }

  return {
    addedKeys: getNewKeys(original, current),
    removedKeys: getNewKeys(current, original),
  };
}

function getNewKeys(keys1, keys2) {
  const newKeys = [];

  for (var i = 0; i < keys2.length; i++) {
    const key = keys2[i];
    if (key instanceof Array && containsMultiKey(keys1, key)) {
      continue;
    }
    if (keys1.indexOf(key) >= 0) {
      continue;
    }
    newKeys.push(key);
  }

  return newKeys;
}

function containsMultiKey(keys, multiKey) {
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key instanceof Array && multiKeysEqual(key, multiKey)) {
      return true;
    }
  }
  return false;
}

function multiKeysEqual(multiKey1, multiKey2) {
  if (multiKey1 === multiKey2) {
    return true;
  }

  const len1 = multiKey1.length;
  const len2 = multiKey2.length;

  if (len1 !== len2) {
    return false;
  }

  for (var i = 0; i < len1; ++i) {
    if (multiKey1[i] !== multiKey2[i]) {
      return false;
    }
  }

  return true;
}

module.exports = diffKeys;
