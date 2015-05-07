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
var duration = require('duration');

var casperBin;

module.exports = function (grunt) {
  grunt.registerMultiTask('casper_queue', 'Run casperjs tests in the cli in parallel queues', function () {
    var startTime = new Date();
    var options = this.options();
    var queueConfig = options.queue;
    var maxRetries = options.maxRetries || 1;
    var queueWorkers = options.queueWorkers || 1;
    var casperCwd = options.casperCwd;
    var casperjsLocations = options.casperjsLocations || [];
    var retries = 0;
    var args = options.args;
    var flags = options.flags;
    var done = this.async();
    var failedTasks = {};
    var queueTimes = [];

    casperjsLocations.some(function (location) {
        if (fs.existsSync(location)) {
          casperBin = location;
          return true;
        }
    });

    if (!casperBin) {
      grunt.log.error("Could not find the casperjs binary.");
      done(false);
    }

    casperBin = path.resolve(process.cwd(), casperBin);
    if (casperCwd) {
      casperCwd = path.resolve(process.cwd(), casperCwd);
      casperBin = path.relative(casperCwd, casperBin);
    }

    var casperRun = function (test, args, failed, callback) {
      var file = path.resolve(process.cwd(), test.file);
      var xunit = "--xunit=" + path.resolve(process.cwd(), test.xunit);
      var overrides = test.overrides;

      _.each(overrides, function (value, key) {
        if (value === '' && args[key]) {
          delete args[key];
        } else {
          args[key] = value;
        }
      });

      args = _.map(args, function (value, key) {
        return key + "=" + value;
      });

      args.unshift(flags);
      args.unshift("test");
      args.unshift(casperBin);
      args.push(file);
      args.push(xunit);

      if (test.options && test.options.runHeadless) {
        args.unshift("xvfb-run -a");
      }

      var command = args.join(" ");

      grunt.log.writeln("Executing command: " + command);

      var execOptions = {
        encoding: "utf8"
      };

      if (casperCwd) {
        execOptions.cwd = casperCwd;
      }

      var result = exec(command, execOptions, function (error, stdout, stderr) {
        if (error) {
          failed.push(test);
          grunt.log.error(error);
        } else if (stdout.match(/FAIL \d tests? executed in \d+\.\d+s, \d+ passed, \d+ failed, \d+ dubious, \d+ skipped\./)) {
          // this is just a double check in case an error code isn't reported on failure (slimerjs)
          failed.push(test);
          grunt.log.error(file + "\n command failed without reporting an error (regex match to failure output)");
        }
        grunt.log.writeln(file + "\n stdout:\n" + stdout);
        callback();
      });
    };

    var pushToQueue = function (queue, queueConfig) {
      _.each(queueConfig, function (tasks, name) {
        queue.push({'name': name, 'tests': tasks}, function (err) {
          if (err) {
            grunt.log.error("Error processing queue: " + name);
          } else {
            grunt.log.writeln("Finished queue: " + name);
          }
        });
      });
    };

    var printLogQueueTimes = function () {
      grunt.log.writeln("\nTest Sets Time Summary: ");
      _.each(queueTimes, function (queueTime) {
        grunt.log.writeln("Test Set: " + queueTime.name + " took " + queueTime.time + "s. Retry #" + queueTime.retry);
      });
    };

    var queue = async.queue(function (task, callback) {
      if (retries) {
        grunt.log.writeln("Retrying failed tests in test set: " + task.name);
      }
      grunt.log.writeln("Starting set: " + task.name);
      var taskStartTime = new Date();
      var failedTests = [];

      async.eachSeries(task.tests, function (test, callback) {
        casperRun(test, _.clone(args), failedTests, callback);
      }, function (err) {
        if (err) {
          grunt.log.error("Something when wrong: ", err);
        } else {
          grunt.log.writeln("Test set: " + task.name + " took " + new duration(taskStartTime).toString("%Ss.%Ls") + " seconds to run.");
          queueTimes.push({name: task.name, time: new duration(taskStartTime).toString("%Ss.%Ls"), retry: retries});
          if (failedTests.length >= 1) {
            failedTasks[task.name] = failedTests;
          }
        }
        callback(); //required for queue task to be considered done
      });
    }, queueWorkers);

    queue.drain = function () {
      if (_.isEmpty(failedTasks) && retries === 0) {
        printLogQueueTimes();
        grunt.log.writeln("Everything is done yo. It took " + new duration(startTime).toString("%Ss.%Ls") + " seconds to run.");
        done();
      } else if (_.isEmpty(failedTasks)) {
        printLogQueueTimes();
        grunt.log.writeln("Everything is done yo, all tests pasted a retrying some " + retries + " times. It took " + new duration(startTime).toString("%Ss.%Ls") + " seconds to run.");
        done();
      } else if (!_.isEmpty(failedTasks) && retries >= maxRetries) {
        printLogQueueTimes();
        grunt.log.error("Everything is done yo, but some tests failed. It took " + new duration(startTime).toString("%Ss.%Ls") + " seconds to run.");
        grunt.log.error("Failed Tests: " + JSON.stringify(failedTasks, null, 2));
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
