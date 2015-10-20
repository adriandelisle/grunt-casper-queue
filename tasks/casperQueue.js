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
    grunt.registerMultiTask('casperQueue', 'Run casperjs tests in the cli in parallel queues', function () {
        var startTime = new Date();
        var globalTimeStamp = startTime.getTime();
        var options = this.options();
        var queueConfig = options.queue;
        var maxRetries = options.maxRetries || 0;
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
        var successLog = [];
        var logPath = 'casperjs/.logs/'
        var infoColor = 'blue';
        var failColor = 'red';
        var successColor = 'green';
        var retryColor = 'yellow';
        var noAnsiColorRegex = /\x1B\[([0-9]{1,2}(;[0-9]{1,2}(;[0-9])?)?)?[m|K]/g;

        casperjsLocations.some(function (location) {
            if (fs.existsSync(location)) {
                casperBin = location;
                return true;
            }
        });

        if (!casperBin) {
            grunt.log.error('Could not find the casperjs binary. @see http://casperjs.org/');
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
                encoding: 'utf8',
                maxBuffer: 1024 * 512
            };

            if (casperCwd) {
                execOptions.cwd = casperCwd;
            }

            exec(command, execOptions, function (error, stdout, stderr) {
                var result = {
                    command: command,
                    file: file,
                    stdout: stdout
                };

                /* This checking is just in the case of an error don't get reported (SlimerJs) */
                var isError = stdout.match(/FAIL \d tests? executed in \d+\.\d+s, \d+ passed, \d+ failed, \d+ dubious, \d+ skipped\./);
                if (error || isError) {
                    failed.push(test);
                    errorLog.push(result);
                    var splitSlash = file.split('/');
                    var testFile = _.last(splitSlash);
                    var testName = testFile.split('.')[0];
                    var output = '';
                    var cmdText = '$ ' + command.split('--xunit')[0] + '\n';
                    output += '\n***********************************************************';
                    output += '\nTEST: ' + testName;
                    output += '\n***********************************************************'
                    output += '\n\n' + cmdText + '\n';
                    output += stdout + '\n\n';
                    var index = 0;
                    var filePath = '';
                    while (grunt.file.exists(filePath)) {
                        filePath = logPath + 'failures/' + testName + '_' + index++ + '_.err';
                    }
                    grunt.file.write(filePath, output);
                }
                successLog.push(result);
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

        var summary = function (testStatus) {
            grunt.log.subhead('Summary:');
            _.each(queueTimes, function (queueTime) {
                var timeSummary = ' Test Set: ' + queueTime.name + ' took ' + queueTime.time + 's. Retry #' + queueTime.retry;
                grunt.log.writeln(timeSummary);
            });
            grunt.log.subhead(' Total time: ' + new Duration(startTime).toString('%Ss.%Ls') + ' seconds.\n');
            switch (testStatus) {
                case 'ok':
                    grunt.log.writeln(' PASSED'[successColor]);
                    break;
                case 'okWithRetry':
                    grunt.log.writeln(' PASSED WITH RETRY(S)'[retryColor]);
                    break;
                case 'failed':
                    if (!_.isEmpty(failedTasks)) {
                        var log = failedTasks;
                        var text = '';
                        for (var key in log) {
                            if (log.hasOwnProperty (key)) {
                                text += ' ✘ ' + key + ' failed.\n';
                                var testSet = log[key];
                                for (var i = 0; i < testSet.length; i++) {
                                    text += '  ✘ '[failColor] + testSet[i].file[failColor] + '\n';
                                };
                            }
                        }
                        grunt.log.writeln(text[failColor]);
                    }
                    break;
                default:
                    grunt.log.writeln('\nALERT! TEST SUITE DID NOT RUN PROPERLY' [failColor] + ' \n');
            }
        };

        var createReport = function (log) {
            try {
                log = _.groupBy(log, 'file');
                var text = '';
                for (var key in log) {
                    if (log.hasOwnProperty (key)) {
                        var splitKey = key.split('/');
                        var testName = _.last(splitKey);
                        var command = log[key][0].command;
                        command = '$ ' + command.split('--xunit')[0];
                        text += '\n***********************************************************';
                        text += '\nTEST: ' + testName;
                        text += '\n***********************************************************'
                        text += '\n\n' + command + '\n';
                        for (var i = 1; i <= log[key].length; i++) {
                            text += '\n\t\t\t\t - ' + i + ' -';
                            text += '\n\n' + log[key][i - 1].stdout + '\n';
                        };
                    }
                }
                return text;
            } catch (err) {
                grunt.log.writeln('Failed to generate failure report.')
                return null;
            }
        };

        var saveReport = function (failedTasks) {
            if (errorLog.length > 0) {
                var failedReport = createReport(errorLog);
                if (failedReport !== null) {
                    var failedReportText = failedReport.replace(noAnsiColorRegex, '');
                    grunt.file.write(logPath + 'failed_tests.txt', failedReportText);
                    grunt.file.write(logPath + 'failed_tests.out', failedReport);
                }
            }
            if (successLog.length > 0) {
                var successReport = createReport(successLog);
                if (successReport !== null) {
                    var successReportText = successReport.replace(noAnsiColorRegex, '');
                    grunt.file.write(logPath + 'passed_tests.txt', successReportText);
                    grunt.file.write(logPath + 'passed_tests.out', successReport);
                }
            }
            grunt.log.subhead('Test\'s output can be found in ' + logPath + '\n');
        };

        var isRetryMessage = false;
        var queue = async.queue(function (task, callback) {
            if (retries && !isRetryMessage) {
                grunt.log.subhead('Retrying failed test(s):');
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
                    if (failedTests.length > 0) {
                        grunt.log.writeln(' ✘ ' [failColor] + task.name [failColor]);
                        _.each(failedTests, function (test) {
                            grunt.log.writeln('   ✘ ' [failColor] + test.file [failColor]);
                        });
                        failedTasks[task.name] = failedTests;
                    } else {
                        grunt.log.writeln(' ✔ ' [successColor] + task.name [successColor]);
                    }
                }
                callback(); //required for queue task to be considered done
            });
        }, queueWorkers);

        queue.drain = function () {
            if (_.isEmpty(failedTasks) && retries === 0) {
                summary('ok');
                saveReport();
                done(true);
            } else if (_.isEmpty(failedTasks)) {
                summary('okWithRetry');
                saveReport();
                done(true);
            } else if (!_.isEmpty(failedTasks) && retries >= maxRetries) {
                summary('failed');
                saveReport();
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
