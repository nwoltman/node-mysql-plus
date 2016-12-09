'use strict';

const fs = require('fs');
const os = require('os');

module.exports = function(grunt) {
  grunt.registerTask('fixdocs', 'Fixes any problems with the generated documentation', () => {
    const docs = fs.readFileSync('README.md', 'utf8')
      .replace(/\r\n|\r|\n/g, os.EOL)
      .replace(/\| --- /g, '|:--- ')
      .replace(new RegExp('  ' + os.EOL + '(?=\\*\\*Example\\*\\*)', 'g'), os.EOL + os.EOL);
    fs.writeFileSync('README.md', docs);
    grunt.log.ok('Fixed docs');
  });
};
