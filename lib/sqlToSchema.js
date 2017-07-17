'use strict';

const ColumnDefinitions = require('./ColumnDefinitions');
const KeyTypes = require('./constants/KeyTypes');

function sqlToSchema(sql) {
  const createTableParts = /^\s*CREATE(?: TEMPORARY)? TABLE.*?`(\w+)`\s*\(([\S\s]+)\)(.*)/.exec(sql);
  const tableName = createTableParts[1];
  const createDefinitions = createTableParts[2].split(/,[\r\n]+/);
  const tableOptions = createTableParts[3];

  const schema = {
    name: tableName,
    columns: generateColumnsSchema(createDefinitions),
    primaryKey: generatePrimaryKeySchema(createDefinitions),
    uniqueKeys: generateKeysSchema(createDefinitions, KeyTypes.UNIQUE),
    indexes: generateKeysSchema(createDefinitions, KeyTypes.INDEX),
    spatialIndexes: generateKeysSchema(createDefinitions, KeyTypes.SPATIAL),
    foreignKeys: generateForegnKeysSchema(createDefinitions),
    $unknownKeys: getUnknownKeys(createDefinitions),
  };

  var match;

  if (match = /ENGINE=(\w+)/.exec(tableOptions)) {
    schema.engine = match[1];
  }

  if (match = /AUTO_INCREMENT=(\d+)/.exec(tableOptions)) {
    schema.autoIncrement = +match[1];
  }

  if (match = /DEFAULT CHARSET=(\w+)/.exec(tableOptions)) {
    schema.charset = match[1];
  }

  if (match = /COLLATE=(\w+)/.exec(tableOptions)) {
    schema.collate = match[1];
  }

  if (match = /COMPRESSION='(\w+)'/.exec(tableOptions)) {
    schema.compression = match[1];
  }

  if (match = /ROW_FORMAT=(\w+)/.exec(tableOptions)) {
    schema.rowFormat = match[1];
  }

  return schema;
}

function generateColumnsSchema(createDefinitions) {
  const columns = {};
  const rgxNameAndType = /^`(\w+)` (\w+)(?:\((.+?)\))?/; // Unhandled case: enum or set contains string with ')'
  const rgxDefault = / DEFAULT (?:'((?:''|[^'])*?)'(?!')|(\S+))/;
  const rgxCharset = / CHARACTER SET (\w+)/;
  const rgxCollate = / COLLATE (\w+)/;

  for (var i = 0; i < createDefinitions.length; i++) {
    const definitionSQL = createDefinitions[i].trim();

    if (definitionSQL[0] !== '`') {
      continue;
    }

    const nameAndType = rgxNameAndType.exec(definitionSQL);
    const name = nameAndType[1];
    const type = nameAndType[2];
    var typeData;

    if (type === 'enum' || type === 'set') {
      // `'A','B','C'` => ['A', 'B', 'C']
      typeData = nameAndType[3].slice(1, -1).split(/','/);
    } else if (nameAndType[3]) {
      typeData = nameAndType[3].split(',').map(x => +x); // Convert each to a number
    } else {
      typeData = [];
    }

    const columnDefintion = ColumnDefinitions[type].apply(null, typeData);

    if (definitionSQL.indexOf(' NOT NULL') >= 0) {
      columnDefintion.notNull();
    }

    if (definitionSQL.indexOf(' AUTO_INCREMENT') >= 0) {
      columnDefintion.autoIncrement();
    }

    if (definitionSQL.indexOf(' unsigned') >= 0) {
      columnDefintion.unsigned();
    }

    if (definitionSQL.indexOf(' zerofill') >= 0) {
      columnDefintion.zerofill();
    }

    if (
      (type === 'datetime' || type === 'timestamp') &&
      definitionSQL.indexOf(' ON UPDATE CURRENT_TIMESTAMP') >= 0
    ) {
      columnDefintion.onUpdateCurrentTimestamp();
    }

    var match;

    if (match = rgxDefault.exec(definitionSQL)) {
      if (match[2]) {
        columnDefintion.$defaultRaw(match[2]);
      } else {
        columnDefintion.default(match[1]);
      }
    }

    if (match = rgxCharset.exec(definitionSQL)) {
      columnDefintion.charset(match[1]);
    }

    if (match = rgxCollate.exec(definitionSQL)) {
      columnDefintion.collate(match[1]);
    }

    columns[name] = columnDefintion;
  }

  return columns;
}

function columnsSQLToSchema(sql) {
  const schema = sql.replace(/`|\s/g, '');

  return schema.indexOf(',') >= 0 ? schema.split(',') : schema;
}

function generatePrimaryKeySchema(createDefinitions) {
  const rgxPrimaryKey = /^\s*PRIMARY KEY \((.*?)\)/;

  for (var i = 0; i < createDefinitions.length; i++) {
    var pkMatch = rgxPrimaryKey.exec(createDefinitions[i]);

    if (pkMatch) {
      return columnsSQLToSchema(pkMatch[1]);
    }
  }

  return null;
}

function generateKeysSchema(createDefinitions, keyType) {
  const keys = [];
  let rgxKey = null;

  switch (keyType) {
    case KeyTypes.UNIQUE:
      rgxKey = /^\s*UNIQUE KEY `unique_\w+` \((.*?)\)/;
      break;
    case KeyTypes.INDEX:
      rgxKey = /^\s*KEY `index_\w+` \((.*?)\)/;
      break;
    case KeyTypes.SPATIAL:
      rgxKey = /^\s*SPATIAL KEY `spatial_\w+` \((.*?)\)/;
      break;
  }

  for (var i = 0; i < createDefinitions.length; i++) {
    var keyMatch = rgxKey.exec(createDefinitions[i]);

    if (keyMatch) {
      keys.push(columnsSQLToSchema(keyMatch[1]));
    }
  }

  return keys.length ? keys : null;
}

function getUnknownKeys(createDefinitions) {
  const keys = [];
  const rgxKey =
    /^\s*(?:UNIQUE KEY `((?!unique_)\w+)`|KEY `((?!index_)\w+)`|SPATIAL KEY `((?!spatial_)\w+)`) \((.*?)\)/;

  for (var i = 0; i < createDefinitions.length; i++) {
    var keyMatch = rgxKey.exec(createDefinitions[i]);

    if (keyMatch) {
      keys.push({
        name: keyMatch[1] || keyMatch[2] || keyMatch[3],
        columns: columnsSQLToSchema(keyMatch[4]),
      });
    }
  }

  return keys;
}

function generateForegnKeysSchema(createDefinitions) {
  const foreignKeys = {};
  const rgxForeignKey =
    /\s*CONSTRAINT `\w+` FOREIGN KEY \(`(.*?)`\) REFERENCES `(\w+)` \((.*?)\)(?: ON DELETE (RESTRICT|CASCADE|SET NULL|NO ACTION))?(?: ON UPDATE (RESTRICT|CASCADE|SET NULL|NO ACTION))?/;

  for (var i = 0; i < createDefinitions.length; i++) {
    var keyMatch = rgxForeignKey.exec(createDefinitions[i]);

    if (!keyMatch) {
      continue;
    }

    const keyColumns = columnsSQLToSchema(keyMatch[1]);

    foreignKeys[keyColumns] = {
      table: keyMatch[2],
      column: columnsSQLToSchema(keyMatch[3]),
      onDelete: keyMatch[4] || null,
      onUpdate: keyMatch[5] || null,
    };
  }

  return foreignKeys;
}

module.exports = sqlToSchema;
