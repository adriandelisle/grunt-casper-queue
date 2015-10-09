/*
 * grunt-casper-queue
 *
 *
 * Copyright (c) 2015 Adrian De Lisle
 * Licensed under the MIT license.
 */

'use strict';

var exec = require('child_process').exec;
var async = require('async');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var Duration = require('duration');

var casperBin;

module.exports = function (grunt) {
    grunt.registerMultiTask('casper_queue', 'Run casperjs tests in the cli in parallel queues', function () {
        var startTime = new Date();
        var options = this.options();
        var queueConfig = options.queue;
        var maxRetries = options.maxRetries || 2;
        var queueWorkers = options.queueWorkers || 1;
        var casperCwd = options.casperCwd;
        var casperjsLocations = options.casperjsLocations || [];
        var retries = 0;
        var args = options.args;
        var flags = options.flags;
        var done = this.async();
        var failedTasks = {};
        var queueTimes = [];
        var log = [];
        var blue = 'blue';
        var red = 'red';
        var green = 'green';

        casperjsLocations.some(function (location) {
            if (fs.existsSync(location)) {
                casperBin = location;
                return true;
            }
        });

        if (!casperBin) {
            grunt.log.error('Could not find the casperjs binary.');
            done(false);
        }

        casperBin = path.resolve(process.cwd(), casperBin);
        if (casperCwd) {
            casperCwd = path.resolve(process.cwd(), casperCwd);
            casperBin = path.relative(casperCwd, casperBin);
        }

        var casperRun = function (test, args, failed, callback) {
            var file = path.resolve(process.cwd(), test.file);
            var xunit = '--xunit=' + path.resolve(process.cwd(), test.xunit);
            var overrides = test.overrides;

            _.each(overrides, function (value, key) {
                if (value === '' && args[key]) {
                    delete args[key];
                } else {
                    args[key] = value;
                }
            });

            args = _.map(args, function (value, key) {
                return key + '=' + value;
            });

            args.unshift(flags);
            args.unshift('test');
            args.unshift(casperBin);
            args.push(file);
            args.push(xunit);

            if (test.options && test.options.runHeadless) {
                args.unshift('xvfb-run -a');
            }

            var command = args.join(' ');

            var execOptions = {
                encoding: 'utf8'
            };

            if (casperCwd) {
                execOptions.cwd = casperCwd;
            }

            // TODO: consider push grunt.log.writeln('Executing command: ' + command) into log
            var result = exec(command, execOptions, function (error, stdout, stderr) {
                if (error) {
                    failed.push(test);
                    log.push({
                        path: file,
                        log: stdout
                    });
                    grunt.log.error(error);
                } else if (stdout.match(/FAIL \d tests? executed in \d+\.\d+s, \d+ passed, \d+ failed, \d+ dubious, \d+ skipped\./)) {
                    log.push({
                        path: file,
                        log: stdout
                    });

                    // this is just a double check in case an error code isn't reported on failure (slimerjs)
                    failed.push(test);
                }
                grunt.log.writeln(file + '\n stdout:\n' + stdout);
                callback();
            });
        };

        var pushToQueue = function (queue, queueConfig) {
            _.each(queueConfig, function (tasks, name) {
                queue.push({
                    'name': name,
                    'tests': tasks
                }, function (err) {
                    if (err) {
                        grunt.log.error('Error processing queue: ' + name);
                    }
                });
            });
        };


        var printLogQueueTimes = function () {
            grunt.log.writeln('\n********************************' [blue]);
            grunt.log.writeln(' Test Sets Time Summary: ' [blue]);
            grunt.log.writeln('********************************\n' [blue]);

            _.each(queueTimes, function (queueTime) {
                grunt.log.writeln('Test Set: ' + queueTime.name + ' took ' + queueTime.time + 's. Retry #' + queueTime.retry);
            });
        };

        var report = function () {
            if (log.length > 0) {
                grunt.log.writeln('\n********************************' [blue]);
                grunt.log.writeln(' Detailed Failure Report: ' [blue]);
                grunt.log.writeln('********************************' [blue]);
                var index = 0;
                _.each(log, function (l) {
                    grunt.log.writeln('\n--------------------------\tFAILURE # ' [blue] + index.toString() [blue] + '\t ---------------------------\n' [blue]);
                    grunt.log.writeln(l.log);
                    index++;
                });
            }
        };

        var queue = async.queue(function (task, callback) {
            if (retries) {
                grunt.log.writeln('Retrying failed tests in test set: ' + task.name);
            }

            grunt.log.writeln('Starting set: ' + task.name);
            var taskStartTime = new Date();
            var failedTests = [];

            async.eachSeries(task.tests, function (test, callback) {
                casperRun(test, _.clone(args), failedTests, callback);
            },
            function (err) {
                if (err) {
                    grunt.log.error('Something when wrong: ', err);
                } else {
                    queueTimes.push({name: task.name, time: new Duration(taskStartTime).toString('%Ss.%Ls'), retry: retries});
                    if (failedTests.length >= 1) {
                        grunt.log.writeln(' ✘ ' [red] + task.name [red]);
                        _.each(failedTests, function (test) {
                            grunt.log.writeln(' Test: ' [red] + test.file [red]);
                        });
                        failedTasks[task.name] = failedTests;
                    } else {
                        grunt.log.writeln(' ✔ ' [green] + task.name [green]);
                    }
                }
                callback(); //required for queue task to be considered done
            });
        }, queueWorkers);

        queue.drain = function () {
            if (_.isEmpty(failedTasks) && retries === 0) {
                printLogQueueTimes();
                grunt.log.writeln('Everything is done yo. It took ' + new Duration(startTime).toString('%Ss.%Ls') + ' seconds to run.');
                done();
            } else if (_.isEmpty(failedTasks)) {
                printLogQueueTimes();
                grunt.log.writeln('Everything is done yo, all tests pasted a retrying some ' + retries + ' times. It took ' + new Duration(startTime).toString('%Ss.%Ls') + ' seconds to run.');
                done();
            } else if (!_.isEmpty(failedTasks) && retries >= maxRetries) {
                report();
                printLogQueueTimes();
                grunt.log.error('Everything is done yo, but some tests failed. It took ' + new Duration(startTime).toString('%Ss.%Ls') + ' seconds to run.');
                grunt.log.error('Failed Tests: ' + JSON.stringify(failedTasks, null, 2));
                done(false);
            } else {
                retries++;
                pushToQueue(queue, failedTasks);
                failedTasks = {};
            }
        };
        pushToQueue(queue, queueConfig);
    });
};
