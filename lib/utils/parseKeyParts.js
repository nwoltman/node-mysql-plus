'use strict';

const {escapeId} = require('sqlstring');

function parseKeyParts(keyParts) {
  const columnNames = [];
  const formattedKeyParts = [];

  for (let i = 0; i < keyParts.length; i++) {
    const parsedKeyPart = parseKeyPart(keyParts[i]);

    columnNames.push(parsedKeyPart.column);
    formattedKeyParts.push(formatKeyPart(parsedKeyPart));
  }

  return {columnNames, formattedKeyParts};
}

const rgxKeyPart = /^(\w+)(?:\s*\((\d+)\))?(?:\s+(ASC|DESC))?/i;

function parseKeyPart(keyPart) {
  const match = rgxKeyPart.exec(keyPart);

  if (match === null) {
    throw new Error('Invalid key part: ' + keyPart);
  }

  return {
    column: match[1],
    length: match[2],
  };
}

function formatKeyPart(keyPart) {
  let sql = escapeId(keyPart.column);

  if (keyPart.length !== undefined) {
    sql += `(${keyPart.length})`;
  }

  return sql;
}

module.exports = parseKeyParts;
