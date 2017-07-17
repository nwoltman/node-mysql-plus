/**
 * isKeyEqual
 *
 * Compares two key definitions and returns true if they are equal and false if they are not.
 */

'use strict';

const arraysEqual = require('./arraysEqual');

function isKeyEqual(keyA, keyB) {
  if (!keyA) {
    return !keyB; // If both keys are falsy, they are equal
  }

  if (!keyB) {
    return false;
  }

  if (keyA instanceof Array) {
    return keyB instanceof Array
      ? arraysEqual(keyA, keyB) // multi-column key
      : false;
  }

  if (typeof keyA === 'object') {
    return typeof keyB === 'object'
      ? isForeignKeyObjectEqual(keyA, keyB)
      : false;
  }

  return keyA === keyB; // Both keys are strings
}

function isForeignKeyObjectEqual(objA, objB) {
  if (
    objA.table !== objB.table ||
    objA.onDelete !== objB.onDelete ||
    objA.onUpdate !== objB.onUpdate
  ) {
    return false;
  }

  if (objA.column instanceof Array && objB.column instanceof Array) {
    return arraysEqual(objA.column, objB.column);
  }

  return objA.column === objB.column;
}

module.exports = isKeyEqual;
