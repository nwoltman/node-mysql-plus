'use strict';

const mysql = require('mysql');

module.exports = function(grunt) {
  grunt.registerTask('createTestDB', 'Creates an empty test database', function() {
    const done = this.async();

    const db = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
    });
    const database = process.env.MYSQL_DATABASE;

    db.query('DROP DATABASE IF EXISTS ??', [database], err => {
      if (err) throw err;
      db.query('CREATE DATABASE ?? CHARACTER SET utf8 COLLATE utf8_general_ci', [database], err => {
        if (err) throw err;
        grunt.log.ok(`Created empty database "${database}"`);
        done();
      });
    });
  });
};
