'use strict';

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

});
