'use strict';

const fs = require('fs');

module.exports = function(grunt) {
  grunt.registerTask('fixdocs', 'Fixes any problems with the generated documentation', () => {
    const docs = fs.readFileSync('README.md', 'utf8')
      .replace(/\r\n|\r|\n/g, '\n')
      .replace(/\| --- /g, '|:--- ')
      .replace(/<\/code><code>/g, '</code> &#124; <code>') // Add ' | ' between multiple types
      .replace(/ {2}\n(?=\*\*Example\*\*)/g, '\n\n')
      .replace(/\s*?\n/g, '\n');
    fs.writeFileSync('README.md', docs);
    grunt.log.ok('Fixed docs');
  });
};
