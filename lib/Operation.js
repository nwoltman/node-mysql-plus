'use strict';

var position = 0;

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
    CHANGE_COLUMN: 8,
    ADD_COLUMN: 9,
    ADD_KEY: 10,
    ADD_FOREIGN_KEY: 11,
  },

  create(type, sql, columns) {
    return {type, sql, columns, position: position++};
  },

  sorter(a, b) { // Stable sort by priority
    return a.type - b.type || a.position - b.position;
  },
};

module.exports = Operation;
