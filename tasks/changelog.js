'use strict';

const execSync = require('child_process').execSync;
const pkg = require('../package');
const fs = require('fs');
const semver = require('semver');

module.exports = function(grunt) {
  grunt.registerTask('changelog', 'Add the changes since the last release to the changelog', releaseType => {
    const curVersion = pkg.version;
    const nextVersion = semver.inc(curVersion, releaseType);
    if (!nextVersion) {
      grunt.fail.fatal('Invalid release type: ' + releaseType);
    }

    const repoUrl = pkg.repository.url.slice(0, -4); // Slice off '.git'
    const getCommitLog =
      `git --no-pager log v${curVersion}... --reverse --pretty=format:"+ %s ([\`%h\`](${repoUrl}/commit/%H))"`;
    const commitLog = execSync(getCommitLog).toString();
    const changes = commitLog.replace(/^\+ Merge.*[\r\n]*/gm, ''); // Filter out merge commits
    const date = new Date().toISOString().slice(0, 10);
    const versionHeader = `## ${nextVersion} (${date})\n`;

    var changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

    if (changelog.indexOf(versionHeader, 13) >= 0) {
      grunt.log.warn('Changelog already updated.');
      return;
    }

    changelog = '# CHANGELOG\n\n' +
                versionHeader + '\n' +
                changes + '\n\n' +
                changelog.replace(/^# CHANGELOG\s+/, '\n');

    fs.writeFileSync('CHANGELOG.md', changelog);
    grunt.log.ok('Added changes to the changelog.');
  });
};
