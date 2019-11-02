'use strict';

/* eslint-disable camelcase, no-sync */

const fs = require('fs');

module.exports = function(grunt) {
  require('jit-grunt')(grunt, {
    jsdoc2md: 'grunt-jsdoc-to-markdown',
  })({
    customTasksDir: 'tasks',
  });

  grunt.initConfig({
    eslint: {
      all: ['*.js', '@(lib|tasks|test)/**/*.js'],
    },

    env: {
      main: {
        NODE_ENV: 'development',
        options: {
          add: {
            MYSQL_HOST: 'localhost',
            MYSQL_PORT: 3306,
            MYSQL_USER: 'root',
            MYSQL_PASSWORD: '',
            MYSQL_DATABASE: 'mysql_plus_test',
          },
        },
      },
    },

    mochaTest: {
      unit: {
        src: 'test/unit/*.js',
      },
      integration: {
        src: 'test/integration/*.js',
      },
      options: {
        bail: grunt.option('bail'),
        colors: true,
        require: ['should', 'should-sinon'],
        reporter: grunt.option('grep') ? 'spec' : 'dot',
      },
    },

    mocha_istanbul: {
      coverage: {
        src: 'test/@(unit|integration)/*.js',
        options: {
          reportFormats: ['html'],
        },
      },
      coveralls: {
        src: 'test/@(unit|integration)/*.js',
        options: {
          coverage: true,
          reportFormats: ['lcovonly'],
        },
      },
      options: {
        check: {
          branches: 100,
          lines: 100,
          statements: 100,
        },
        mochaOptions: ['--colors', '--reporter', 'dot'],
        require: ['should', 'should-sinon'],
      },
    },

    jsdoc2md: {
      docs: {
        options: {
          partial: [
            'jsdoc2md/partials/body.hbs',
            'jsdoc2md/partials/examples.hbs',
            'jsdoc2md/partials/link.hbs',
            'jsdoc2md/partials/linked-type-list.hbs',
            'jsdoc2md/partials/main-index.hbs',
            'jsdoc2md/partials/params-table.hbs',
            'jsdoc2md/partials/param-table-name.hbs',
            'jsdoc2md/partials/separator.hbs',
          ],
          separators: true,
          'sort-by': ['order'],
          template: fs.readFileSync('jsdoc2md/README.hbs', 'utf8'),
        },
        src: ['lib/MySQLPlus.js', 'lib/PoolPlus.js', 'lib/Connection.js', 'lib/MySQLTable.js'],
        dest: 'README.md',
      },
    },
  });

  grunt.event.on('coverage', (lcov, done) => {
    require('coveralls').handleInput(lcov, done);
  });

  // Register tasks
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('testSetup', ['env', 'createTestDB']);
  grunt.registerTask('test:unit', ['testSetup', 'mochaTest:unit']);
  grunt.registerTask('test:integration', ['testSetup', 'mochaTest:integration']);
  grunt.registerTask('test', ['testSetup', process.env.CI ? 'mocha_istanbul:coveralls' : 'mochaTest']);
  grunt.registerTask('coverage', ['env', 'createTestDB', 'mocha_istanbul:coverage']);
  grunt.registerTask('doc', ['jsdoc2md', 'fixdocs']);
  grunt.registerTask('default', ['lint', 'test']);
};
