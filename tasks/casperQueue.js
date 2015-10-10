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
var Spinner = require('cli-spinner').Spinner;

var casperBin;

module.exports = function (grunt) {
    grunt.registerMultiTask('casperQueue', 'Run casperjs tests in the cli in parallel queues', function () {

        var startTime = new Date();
        var globalTimeStamp = startTime.getTime();
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
        var errorLog = [];
        var infoColor = 'white';
        var failColor = 'red';
        var successColor = 'green';
        var retryColor = 'yellow';
        var spinner = new Spinner('%s ');

        spinner.setSpinnerString('|/-\\');

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

        var stdoutToFile = function (content) {
            var logTimestamp = new Date().getTime();
            var logPath = 'logs/test/' + globalTimeStamp + '/failure_' + logTimestamp + '.log';

            grunt.file.write(logPath, content, { encoding: 'utf-8' });
            return logPath;
        };

        var casperRun = function (test, args, failed, callback) {
            spinner.start();

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

            var result = exec(command, execOptions, function (error, stdout, stderr) {
                if (error) {
                    failed.push(test);
                    errorLog.push({
                        command: command,
                        path: file,
                        stdout: stdout
                    });
                } else if (stdout.match(/FAIL \d tests? executed in \d+\.\d+s, \d+ passed, \d+ failed, \d+ dubious, \d+ skipped\./)) {
                    errorLog.push({
                        command: command,
                        path: file,
                        stdout: stdout
                    });

                    // this is just a double check in case an error code isn't reported on failure (slimerjs)
                    failed.push(test);
                }
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
                        spinner.stop();
                        grunt.log.error('Error processing queue: ' + name);
                    }
                });
            });
        };

        var summary = function (numberOfTries, testStatus) {
            grunt.log.writeln('\n*****************************************' [infoColor]);
            grunt.log.writeln('\t     Test Summary: ' [infoColor]);
            grunt.log.writeln('*****************************************\n' [infoColor]);

            switch (testStatus) {
                case 'ok':
                    grunt.log.writeln('PASSED'[successColor] + ' \n');
                    break;
                case 'okWithRetry':
                    grunt.log.writeln('PASSED WITH RETRY(S)'[retryColor] + ' \n');
                    break;
                case 'failed':
                    grunt.log.writeln('FAILED'[failColor] + ' \n');
                    break;
                default:
                    grunt.log.writeln('ALERT! TEST SUITE DID NOT RUN PROPERLY' [failColor] + ' \n');
            }

            _.each(queueTimes, function (queueTime) {
                grunt.log.writeln(
                    'Test Set: ' + queueTime.name + ' took ' + queueTime.time + 's. Retry #' + queueTime.retry
                );
            });
            grunt.log.writeln('\nTotal time: ' + new Duration(startTime).toString('%Ss.%Ls') + ' seconds.');
            grunt.log.writeln('Total retry(s): ' + numberOfTries);
        };

        var failureReport = function () {
            if (errorLog.length > 0) {
                grunt.log.writeln('\n*****************************************' [infoColor]);
                grunt.log.writeln('\t Detailed Failure Report: ' [infoColor]);
                grunt.log.writeln('*****************************************\n' [infoColor]);

                var index = 0;

                _.each(errorLog, function (log) {

                    /* grunt.log.writeln(
                        '\n--------------------------\tFAILURE # ' [infoColor] +
                        index.toString() [infoColor] +
                        '\t ---------------------------\n' [infoColor]
                    );*/

                    var errorStdout = 'TEST PATH: ' + log.path + '\n\nCOMMAND: ' + log.command + '\n\nTEST:\n\n' + log.stdout;
                    var path = stdoutToFile(errorStdout);

                    grunt.log.writeln(path);
                    index++;
                });
            }
        };

        var isRetryMessage = false;
        var queue = async.queue(function (task, callback) {
            if (retries && !isRetryMessage) {
                grunt.log.writeln('\nRetrying failed test(s): \n' [infoColor]);
                isRetryMessage = true;
            }

            var taskStartTime = new Date();
            var failedTests = [];

            async.eachSeries(task.tests, function (test, callback) {
                casperRun(test, _.clone(args), failedTests, callback);
            },
            function (err) {
                if (err) {
                    grunt.log.error('Something when wrong: ', err);
                } else {
                    queueTimes.push({
                        name: task.name,
                        time: new Duration(taskStartTime).toString('%Ss.%Ls'),
                        retry: retries
                    });
                    if (failedTests.length >= 1) {
                        spinner.stop(true);
                        grunt.log.writeln('✘ ' [failColor] + task.name [failColor]);
                        spinner.start();
                        _.each(failedTests, function (test) {
                            spinner.stop(true);
                            grunt.log.writeln('  ✘ ' [failColor] + test.file [failColor]);
                            spinner.start();
                        });
                        failedTasks[task.name] = failedTests;
                    } else {
                        spinner.stop(true);
                        grunt.log.writeln('✔ ' [successColor] + task.name [successColor]);
                        spinner.start();
                    }
                }
                callback(); //required for queue task to be considered done
            });
        }, queueWorkers);

        queue.drain = function () {
            spinner.stop(true);
            if (_.isEmpty(failedTasks) && retries === 0) {
                summary(retries, 'ok');
                done(true);
            } else if (_.isEmpty(failedTasks)) {
                summary(retries, 'okWithRetry');
                done(true);
            } else if (!_.isEmpty(failedTasks) && retries > maxRetries) {
                failureReport();
                summary(retries, 'failed');
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
