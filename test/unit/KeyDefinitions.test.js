'use strict';

const KeyDefinitions = require('../../lib/KeyDefinitions');

const should = require('should');

describe('KeyDefinitions', () => {

  it('should throw if no columns are passed', () => {
    should.throws(() => KeyDefinitions.index(), 'Cannot create a key with 0 columns');
    should.throws(() => KeyDefinitions.uniqueIndex(), 'Cannot create a key with 0 columns');
    should.throws(() => KeyDefinitions.spatialIndex(), 'Cannot create a key with 0 columns');
    should.throws(() => KeyDefinitions.fulltextIndex(), 'Cannot create a key with 0 columns');
    should.throws(() => KeyDefinitions.foreignKey(), 'Cannot create a key with 0 columns');
  });

  it('should allow the key name to be customized', () => {
    KeyDefinitions.index('id').name('my_index').$toSQL()
      .should.equal('INDEX `my_index` (`id`)');

    KeyDefinitions.uniqueIndex('id').name('my_index').$toSQL()
      .should.equal('UNIQUE INDEX `my_index` (`id`)');

    KeyDefinitions.spatialIndex('id').name('my_index').$toSQL()
      .should.equal('SPATIAL INDEX `my_index` (`id`)');

    KeyDefinitions.fulltextIndex('id').name('my_index').$toSQL()
      .should.equal('FULLTEXT INDEX `my_index` (`id`)');

    KeyDefinitions.foreignKey('id').name('my_key').references('t', 'id').$toSQL()
      .should.equal('CONSTRAINT `my_key`\n  FOREIGN KEY (`id`) REFERENCES `t` (`id`)');
  });

  it('should correctly determine if two keys are equal', () => {
    var a;
    var b;

    a = KeyDefinitions.index('a');
    b = KeyDefinitions.index('a');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.uniqueIndex('a');
    b = KeyDefinitions.uniqueIndex('a');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.spatialIndex('a');
    b = KeyDefinitions.spatialIndex('a');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.fulltextIndex('a');
    b = KeyDefinitions.fulltextIndex('a');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a').references('t', 'id');
    b = KeyDefinitions.foreignKey('a').references('t', 'id');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.index('a').name('my_key');
    b = KeyDefinitions.index('a').name('my_key');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.uniqueIndex('a').name('my_key');
    b = KeyDefinitions.uniqueIndex('a').name('my_key');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.spatialIndex('a').name('my_key');
    b = KeyDefinitions.spatialIndex('a').name('my_key');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.fulltextIndex('a').name('my_key');
    b = KeyDefinitions.fulltextIndex('a').name('my_key');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').name('my_key');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').name('my_key');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.index('a', 'b');
    b = KeyDefinitions.index('a', 'b');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.uniqueIndex('a', 'b');
    b = KeyDefinitions.uniqueIndex('a', 'b');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.spatialIndex('a', 'b');
    b = KeyDefinitions.spatialIndex('a', 'b');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.fulltextIndex('a', 'b');
    b = KeyDefinitions.fulltextIndex('a', 'b');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a', 'b').references('t', 'id');
    b = KeyDefinitions.foreignKey('a', 'b').references('t', 'id');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.index('a');
    b = KeyDefinitions.index('b');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.uniqueIndex('a');
    b = KeyDefinitions.uniqueIndex('b');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.spatialIndex('a');
    b = KeyDefinitions.spatialIndex('b');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.fulltextIndex('a');
    b = KeyDefinitions.fulltextIndex('b');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id');
    b = KeyDefinitions.foreignKey('b').references('t', 'id');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.index('a').name('my_key');
    b = KeyDefinitions.index('b').name('my_key');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.uniqueIndex('a').name('my_key');
    b = KeyDefinitions.uniqueIndex('b').name('my_key');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.spatialIndex('a').name('my_key');
    b = KeyDefinitions.spatialIndex('b').name('my_key');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.fulltextIndex('a').name('my_key');
    b = KeyDefinitions.fulltextIndex('b').name('my_key');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').name('my_key');
    b = KeyDefinitions.foreignKey('b').references('t', 'id').name('my_key');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.index('a').name('my_key');
    b = KeyDefinitions.index('a').name('my_index');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.uniqueIndex('a').name('my_key');
    b = KeyDefinitions.uniqueIndex('a').name('my_index');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.spatialIndex('a').name('my_key');
    b = KeyDefinitions.spatialIndex('a').name('my_index');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.fulltextIndex('a').name('my_key');
    b = KeyDefinitions.fulltextIndex('a').name('my_index');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').name('my_key');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').name('my_index');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.index('a', 'b');
    b = KeyDefinitions.index('a', 'c');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.uniqueIndex('a', 'b');
    b = KeyDefinitions.uniqueIndex('a', 'c');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.spatialIndex('a', 'b');
    b = KeyDefinitions.spatialIndex('a', 'c');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.fulltextIndex('a', 'b');
    b = KeyDefinitions.fulltextIndex('a', 'c');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a', 'b').references('t', 'id');
    b = KeyDefinitions.foreignKey('a', 'c').references('t', 'id');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.index('a');
    b = KeyDefinitions.index('a', 'b');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.uniqueIndex('a');
    b = KeyDefinitions.uniqueIndex('a', 'b');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.spatialIndex('a');
    b = KeyDefinitions.spatialIndex('a', 'b');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.fulltextIndex('a');
    b = KeyDefinitions.fulltextIndex('a', 'b');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id');
    b = KeyDefinitions.foreignKey('a', 'b').references('t', 'id');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.index('a', 'c');
    b = KeyDefinitions.index('a');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.uniqueIndex('a', 'c');
    b = KeyDefinitions.uniqueIndex('a');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.spatialIndex('a', 'c');
    b = KeyDefinitions.spatialIndex('a');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.fulltextIndex('a', 'c');
    b = KeyDefinitions.fulltextIndex('a');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a', 'c').references('t', 'id');
    b = KeyDefinitions.foreignKey('a').references('t', 'id');
    a.$equals(b).should.be.false();

    // More for foreign keys

    a = KeyDefinitions.foreignKey('a').references('t', ['id']);
    b = KeyDefinitions.foreignKey('a').references('t', 'id');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a', 'b').references('t', ['a', 'b']);
    b = KeyDefinitions.foreignKey('a', 'b').references('t', ['a', 'b']);
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').onUpdate('NO ACTION');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').onUpdate('NO ACTION');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE').onUpdate('SET NULL');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE').onUpdate('SET NULL');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').cascade();
    b = KeyDefinitions.foreignKey('a').references('t', 'id').cascade();
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').cascade();
    b = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE').onUpdate('CASCADE');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.foreignKey('a', 'b').references('t', ['a', 'b']);
    b = KeyDefinitions.foreignKey('a', 'b').references('t', ['a', 'c']);
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a', 'b').references('t', ['a', 'b']);
    b = KeyDefinitions.foreignKey('a', 'c').references('t', ['a', 'b']);
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a', 'b').references('t', ['a', 'b']);
    b = KeyDefinitions.foreignKey('a').references('t', ['a']);
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id');
    b = KeyDefinitions.foreignKey('a').references('g', 'id');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id');
    b = KeyDefinitions.foreignKey('a').references('t', 'uid');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('NO ACTION');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').onUpdate('SET NULL');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').onUpdate('NO ACTION');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE').onUpdate('SET NULL');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('SET NULL').onUpdate('CASCADE');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id');
    b = KeyDefinitions.foreignKey('a').references('t', 'id').cascade();
    a.$equals(b).should.be.false();

    a = KeyDefinitions.foreignKey('a').references('t', 'id').cascade();
    b = KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('SET NULL').onUpdate('CASCADE');
    a.$equals(b).should.be.false();

    // More for keys with a prefix length

    a = KeyDefinitions.index('a(20)');
    b = KeyDefinitions.index('a(20)');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.uniqueIndex('a(20)');
    b = KeyDefinitions.uniqueIndex('a(20)');
    a.$equals(b).should.be.true();

    a = KeyDefinitions.index('a(20)');
    b = KeyDefinitions.index('a(10)');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.uniqueIndex('a(20)');
    b = KeyDefinitions.uniqueIndex('a(10)');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.index('a(20)');
    b = KeyDefinitions.index('b(20)');
    a.$equals(b).should.be.false();

    a = KeyDefinitions.uniqueIndex('a(20)');
    b = KeyDefinitions.uniqueIndex('b(20)');
    a.$equals(b).should.be.false();
  });

  it('should support keys with a prefix length', () => {
    KeyDefinitions.index('id(20)').$toSQL()
      .should.equal('INDEX `idx_id` (`id`(20))');

    KeyDefinitions.uniqueIndex('id(20)').$toSQL()
      .should.equal('UNIQUE INDEX `uniq_id` (`id`(20))');

    KeyDefinitions.index('id(20)', 'name(5)').$toSQL()
      .should.equal('INDEX `idx_id_name` (`id`(20), `name`(5))');

    KeyDefinitions.uniqueIndex('id(20)', 'name(5)').$toSQL()
      .should.equal('UNIQUE INDEX `uniq_id_name` (`id`(20), `name`(5))');
  });


  describe('foreign key definitions', () => {

    it('should provide foreign key-specific methods', () => {
      KeyDefinitions.foreignKey('a').references('t', 'id').$toSQL()
        .should.equal('CONSTRAINT `fk_a_`\n  FOREIGN KEY (`a`) REFERENCES `t` (`id`)');

      KeyDefinitions.foreignKey('a').references('t', ['a', 'b']).$toSQL()
        .should.equal('CONSTRAINT `fk_a_`\n  FOREIGN KEY (`a`) REFERENCES `t` (`a`, `b`)');

      KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE').$toSQL()
        .should.equal('CONSTRAINT `fk_a_`\n  FOREIGN KEY (`a`) REFERENCES `t` (`id`) ON DELETE CASCADE');

      KeyDefinitions.foreignKey('a').references('t', 'id').onUpdate('NO ACTION').$toSQL()
        .should.equal('CONSTRAINT `fk_a_`\n  FOREIGN KEY (`a`) REFERENCES `t` (`id`) ON UPDATE NO ACTION');

      KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('CASCADE').onUpdate('SET NULL').$toSQL()
        .should.equal('CONSTRAINT `fk_a_`\n  FOREIGN KEY (`a`) REFERENCES `t` (`id`) ON DELETE CASCADE ON UPDATE SET NULL');

      KeyDefinitions.foreignKey('a').references('t', 'id').onDelete('cascade').onUpdate('set null').$toSQL()
        .should.equal('CONSTRAINT `fk_a_`\n  FOREIGN KEY (`a`) REFERENCES `t` (`id`) ON DELETE CASCADE ON UPDATE SET NULL');

      KeyDefinitions.foreignKey('a').references('t', 'id').cascade().$toSQL()
        .should.equal('CONSTRAINT `fk_a_`\n  FOREIGN KEY (`a`) REFERENCES `t` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    });

    it('should throw if passed an invalid reference option', () => {
      should.throws(() => KeyDefinitions.foreignKey('a').onDelete('INVALID'), 'Invalid foreign key reference option: INVALID');
      should.throws(() => KeyDefinitions.foreignKey('a').onUpdate('INVALID'), 'Invalid foreign key reference option: INVALID');
    });

  });

});
