'use strict';

const {execSync} = require('child_process');
const pkg = require('../package');
const semver = require('semver');

module.exports = function(grunt) {
  grunt.registerTask('bump', 'Bumps the package version and makes a tagged commit', (releaseType) => {
    if (!semver.inc(pkg.version, releaseType)) {
      grunt.fail.fatal('Invalid release type: ' + releaseType);
    }

    const stdout = execSync(`npm version ${releaseType} -m "v%s"`);
    grunt.log.ok('Updated package version and created tagged commit: ' + stdout);
  });
};
