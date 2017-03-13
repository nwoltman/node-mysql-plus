'use strict';

var position = 0;

const Operation = {
  // Ordered by priority (smaller number = higher priority)
  Types: {
    // Types that get run as queries
    DROP_FOREIGN_KEY: 1,
    DROP_TABLE: 2,
    CREATE_TABLE: 3,
    ALTER_TABLE: 4,
    ADD_FOREIGN_KEY: 5,

    // Types that get merged into an ALTER query
    DROP_KEY: 11,
    DROP_COLUMN: 12,
    MODIFY_TABLE_OPTIONS: 13,
    MODIFY_COLUMN: 14,
    CHANGE_COLUMN: 15,
    ADD_COLUMN: 16,
    ADD_KEY: 17,
  },

  create(type, sql, columns) {
    return {type, sql, columns, position: position++};
  },

  sorter(a, b) { // Stable sort by priority
    return a.type - b.type || a.position - b.position;
  },
};

module.exports = Operation;
