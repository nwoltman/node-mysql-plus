'use strict';

const Operation = {
  // Ordered by priority (smaller number = higher priority)
  Types: {
    DROP_FOREIGN_KEY: 1,
    DROP_KEY: 2,
    DROP_TABLE: 3,
    CREATE_TABLE: 4,
    DROP_COLUMN: 5,
    MODIFY_TABLE_OPTIONS: 6,
    MODIFY_COLUMN: 7,
    ADD_COLUMN: 8,
    ADD_KEY: 9,
    ADD_FOREIGN_KEY: 10,
  },

  create(type, sql) {
    return {sql, type};
  },
};

module.exports = Operation;
