/*
 * grunt-casper-queue
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
        eslint: {
            target: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>'
            ]
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },

        // Configuration to be run (and then tested).
        casperQueue: {
            test: {
                options: {
                    queueWorkers: 2,
                    maxRetries: 1,
                    casperjsLocations: [
                        '/usr/src/casperjs/bin/casperjs',
                        'node_modules/casperjs/bin/casperjs',
                        'node_modules/grunt-casper-queue/node_modules/casperjs/bin/casperjs'
                    ],
                    args: {
                        '--ignore-ssl-errors': 'yes',
                        '--ssl-protocal': 'any',
                        '--timeout': '10000'
                    },
                    flags: [
                        '--verbose'
                    ],
                    queue: {
                        google: [
                            {
                                file: 'tests/casper-sample-0.js',
                                xunit: 'test-reports/casper-sample-0-0.xml',
                                overrides: {
                                    '--ignore-ssl-errors': '',
                                    '--ssl-protocal': 'sslv3'
                                }
                            },
                            {
                                file: 'tests/casper-sample-0.js',
                                xunit: 'test-reports/casper-sample-0-1.xml',
                                overrides: {

                                    // TODO: Slimer needs to be tested
//                                    '--engine': 'slimerjs'
                                },
                                options: {

                                    // TODO: Slimer needs to be tested
//                                    runHeadless: true
                                }
                            },
                            {
                                file: 'tests/casper-sample-0.js',
                                xunit: 'test-reports/casper-sample-0-2.xml'
                            }
                        ],
                        bing: [
                            {
                                file: 'tests/casper-sample-1.js',
                                xunit: 'test-reports/casper-sample-1-0.xml'
                            }
                        ]
                    }
                }
            },
            success: {
                options: {
                    queueWorkers: 2,
                    casperjsLocations: [
                        '/usr/src/casperjs/bin/casperjs',
                        'node_modules/casperjs/bin/casperjs',
                        'node_modules/grunt-casper-queue/node_modules/casperjs/bin/casperjs'
                    ],
                    args: {
                        '--ignore-ssl-errors': 'yes',
                        '--ssl-protocal': 'any',
                        '--timeout': '10000'
                    },
                    flags: [
                        '--verbose'
                    ],
                    queue: {
                        bing: [
                            {
                                file: 'tests/casper-sample-1.js',
                                xunit: 'test-reports/casper-sample-1-0.xml'},
                            {
                                file: 'tests/casper-sample-1.js',
                                xunit: 'test-reports/casper-sample-1-1.xml'
                            },
                            {
                                file: 'tests/casper-sample-1.js',
                                xunit: 'test-reports/casper-sample-1-2.xml'
                            },
                            {
                                file: 'tests/casper-sample-1.js',
                                xunit: 'test-reports/casper-sample-1-3.xml'
                            },
                            {
                                file: 'tests/casper-sample-1.js',
                                xunit: 'test-reports/casper-sample-1-4.xml'
                            }
                        ]
                    }
                }
            }
        },

        // Unit tests.
        nodeunit: {
            tests: [
                'test/*_test.js'
            ]
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // Linter task
    grunt.registerTask('lint', 'eslint');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean', 'casperQueue', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['eslint', 'test']);

};
