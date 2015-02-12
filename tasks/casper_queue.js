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
    var retries = 0;
    var args = options.args;
    var done = this.async();
    var failedTasks = {};
    var queueTimes = [];

    if (fs.existsSync("node_modules/casperjs/bin/casperjs")) {
      casperBin = "node_modules/casperjs/bin/casperjs";
    } else if (fs.existsSync("node_modules/grunt-casper-queues/node_modules/casperjs/bin/casperjs")) {
      casperBin = "node_modules/grunt-casper-queue/node_modules/casperjs/bin/casperjs";
    } else {
      grunt.log.error("Could not find the casperjs binary.");
      done(false);
    }

    var casperRun = function (test, args, failed, callback) {
      var file = path.resolve(process.cwd(), test.file);
      var xunit = "--xunit=" + path.resolve(process.cwd(), test.xunit);

      args.unshift("test");
      args.unshift(casperBin);
      args.push(file);
      args.push(xunit);

      var command = args.join(" ");

      grunt.log.writeln("Executing command: " + command);

      var result = exec(command, {encoding: "utf8"}, function (error, stdout, stderr) {
        if (error) {
          failed.push(test);
          grunt.log.error(error);
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
        casperRun(test, args.slice(), failedTests, callback);
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
        grunt.log.error("Failed Tests: " + JSON.stringify(failedTasks));
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
