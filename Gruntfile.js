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
        casper_queue: {
            test: {
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
                                    '--engine': 'slimerjs'
                                },
                                options: {
                                    runHeadless: true
                                }
                            },
                            {
                                file: 'tests/casper-sample-0.js',
                                xunit: 'test-reports/casper-sample-0-2.xml'
                            },
                            {
                                file: 'tests/casper-sample-0.js',
                                xunit: 'test-reports/casper-sample-0-3.xml'
                            },
                            {
                                file: 'tests/casper-sample-0.js',
                                xunit: 'test-reports/casper-sample-0-4.xml'
                            }
                        ],
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

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean', 'casper_queue', 'nodeunit']);
    grunt.registerTask('testSuccess', ['casper_queue:success']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);

};
