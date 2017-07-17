/**
 * cloneKeys
 *
 * A function that deep clones a key definition array.
 */

'use strict';

function cloneKeys(keys) {
  if (!keys) {
    return null;
  }

  const keysLen = keys.length;
  const clone = new Array(keysLen);

  for (var i = 0; i < keysLen; i++) {
    clone[i] = keys[i] instanceof Array
      ? keys[i].slice()
      : keys[i];
  }

  return clone;
}

module.exports = cloneKeys;
