'use strict';

const ColumnDefinitions = require('./ColumnDefinitions');
const ForeignKeyDefinition = require('./KeyDefinitions/ForeignKeyDefinition');
const KeyDefinitions = require('./KeyDefinitions');
const PrimaryKeyDefinition = require('./KeyDefinitions/PrimaryKeyDefinition');

function sqlToSchema(sql) {
  const createTableParts = /^\s*CREATE(?: TEMPORARY)? TABLE.*?`(\w+)`\s*\(([\S\s]+)\)(.*)/.exec(sql);
  const tableName = createTableParts[1];
  const createDefinitions = createTableParts[2].split(/,[\r\n]+/);
  const tableOptions = createTableParts[3];

  const columns = generateColumnsSchema(createDefinitions);
  const keyDefinitions = createDefinitions.slice(Object.keys(columns).length);

  let primaryKey = null;
  let keys = [];

  if (keyDefinitions.length > 0) {
    primaryKey = generatePrimaryKeySchema(keyDefinitions[0]);
    keys = primaryKey === null
      ? keyDefinitions.map(generateKeySchema).filter(Boolean)
      : keyDefinitions.slice(1).map(generateKeySchema).filter(Boolean);
  }

  const indexKeys = {};
  const foreignKeys = {};

  for (const key of keys) {
    if (key instanceof ForeignKeyDefinition) {
      foreignKeys[key.$name] = key;
    } else {
      indexKeys[key.$name] = key;
    }
  }

  const schema = {
    name: tableName,
    columns,
    primaryKey,
    indexKeys,
    foreignKeys,
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
      break;
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
  return sql.replace(/`|\s/g, '').split(',');
}

function generatePrimaryKeySchema(keySQL) {
  const pkMatch = /^\s*PRIMARY KEY \((.*?)\)/.exec(keySQL);
  return pkMatch === null
    ? null
    : new PrimaryKeyDefinition(columnsSQLToSchema(pkMatch[1]));
}

const rgxUniqueKey = /^\s*UNIQUE KEY `(\w+)` \((.*?)\)/;
const rgxIndexKey = /^\s*KEY `(\w+)` \((.*?)\)/;
const rgxSpatialKey = /^\s*SPATIAL KEY `(\w+)` \((.*?)\)/;
const rgxFulltextKey = /^\s*FULLTEXT KEY `(\w+)` \((.*?)\)/;
const rgxForeignKey =
  /\s*CONSTRAINT `(\w+)` FOREIGN KEY \(`(.*?)`\) REFERENCES `(\w+)` \(`(.*?)`\)(?: ON DELETE (RESTRICT|CASCADE|SET NULL|NO ACTION))?(?: ON UPDATE (RESTRICT|CASCADE|SET NULL|NO ACTION))?/;

function generateKeySchema(keySQL) {
  let keyMatch = null;

  if ((keyMatch = rgxUniqueKey.exec(keySQL)) !== null) {
    return KeyDefinitions.uniqueIndex(...columnsSQLToSchema(keyMatch[2])).name(keyMatch[1]);
  }

  if ((keyMatch = rgxIndexKey.exec(keySQL)) !== null) {
    return KeyDefinitions.index(...columnsSQLToSchema(keyMatch[2])).name(keyMatch[1]);
  }

  if ((keyMatch = rgxSpatialKey.exec(keySQL)) !== null) {
    return KeyDefinitions.spatialIndex(...columnsSQLToSchema(keyMatch[2])).name(keyMatch[1]);
  }

  if ((keyMatch = rgxFulltextKey.exec(keySQL)) !== null) {
    return KeyDefinitions.fulltextIndex(...columnsSQLToSchema(keyMatch[2])).name(keyMatch[1]);
  }

  if ((keyMatch = rgxForeignKey.exec(keySQL)) !== null) {
    const foreignKey = KeyDefinitions
      .foreignKey(...columnsSQLToSchema(keyMatch[2]))
      .name(keyMatch[1])
      .references(keyMatch[3], columnsSQLToSchema(keyMatch[4]));

    if (keyMatch[5] !== undefined) {
      foreignKey.onDelete(keyMatch[5]);
    }
    if (keyMatch[6] !== undefined) {
      foreignKey.onUpdate(keyMatch[6]);
    }

    return foreignKey;
  }

  return null; // Unknown key type
}

module.exports = sqlToSchema;
