'use strict';

const ColumnDefinitions = require('../../lib/ColumnDefinitions');

const sqlToSchema = require('../../lib/sqlToSchema');

describe('sqlToSchema', () => {

  it('should still work if the SQL contains unknown key types', () => {
    sqlToSchema(`
      CREATE TABLE \`test\` (
        \`id\` bigint(20) NOT NULL,
        UNKNOWN KEY \`un_key\` (\`id\`)
      ) ENGINE=InnoDB
    `).should.be.an.Object()
      .and.have.properties({
        name: 'test',
        primaryKey: null,
        indexKeys: {},
        foreignKeys: {},
      });
  });

  it('should translate MariaDB DEFAULT and ON UPDATE current_timestamp() to be compatible with CURRENT_TIMESTAMP', () => {
    const schema = sqlToSchema(`
      CREATE TABLE \`test\` (
        \`dt\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
      )
    `);

    ColumnDefinitions.datetime()
      .defaultCurrentTimestamp()
      .onUpdateCurrentTimestamp()
      .$equals(schema.columns.dt)
      .should.be.true();
  });

});
