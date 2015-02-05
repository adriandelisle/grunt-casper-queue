/*
 * grunt-casper-queues
 *
 * Copyright (c) 2015 Adrian De Lisle
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
  // load all npm grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    casper_queues: {
      test: {
        options: {
          queueWorkers: 2,
          args: [
            '--verbose',
            '--ignore-ssl-errors=yes',
            '--ssl-protocal=any',
            '--timeout=10000'
            //'--includes='
          ],
          queue: {
            google: [
              {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-0.xml'},
              {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-1.xml'},
              {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-2.xml'},
              {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-3.xml'},
              {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-4.xml'}
            ],
            bing: [
              {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-0.xml'},
              {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-1.xml'},
              {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-2.xml'},
              {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-3.xml'},
              {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-4.xml'}
            ]
          }
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'casper_queues', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
