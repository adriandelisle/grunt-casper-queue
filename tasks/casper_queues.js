/*
 * grunt-casper-queues
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

var casperBin = "node_modules/casperjs/bin/casperjs";

var casperRun = function (test, args, failed, callback) {
  var file = path.resolve(process.cwd(), test.file);
  var xunit = "--xunit=" + path.resolve(process.cwd(), test.xunit);
  
  args.unshift("test");
  args.unshift(casperBin);
  args.push(file);
  args.push(xunit);

  var command = args.join(" ");

  console.log(command);

  var result = exec(command, {encoding: "utf8"}, function (error, stdout, stderr) {
    if (error) {
      failed.push(test);
      console.log(error);
    }
    console.log("stdout: ", stdout);
    console.log("stderr: ", stderr);
    callback();
  });
};

module.exports = function (grunt) {
  grunt.registerMultiTask('casper_queues', 'Run casperjs tests in the cli in parallel queues', function () {
    var startTime = new Date();
    var options = this.options();
    var queueConfig = options.queue;
    var maxRetries = options.maxRetries || 1;
    var retries = 0;
    var args = options.args;
    var done = this.async();
    var failedTasks = {};
    
    var pushToQueue = function (queue, queueConfig) {
      _.each(queueConfig, function (tasks, name) {
        queue.push({'name': name, 'tests': tasks}, function (err) {
          if (err) {
            console.log("Error processing queue", name);
          } else {
            console.log("Finished queue: ", name);
          }
        });
      });
    }

    var queue = async.queue(function (task, callback) {
      if (retries) {
        console.log("Retrying failed tests in test set: ", task.name);
      }
      console.log("Starting set: ", task.name);
      var taskStartTime = new Date();
      var failedTests = [];

      async.eachSeries(task.tests, function (test, callback) {
        casperRun(test, args.slice(), failedTests, callback);
      }, function (err) {
        if (err) {
          console.log("Something when wrong: ", err);
        } else {
          console.log("Test set: " + task.name + " took " + new duration(taskStartTime).toString("%Ss.%Ls") + " seconds to run.");
          if (failedTests.length >= 1) {
            failedTasks[task.name] = failedTests;
          }
        }
        callback(); //required for queue task to be considered done
      });
    }, 2);

    queue.drain = function () {
      if (_.isEmpty(failedTasks) && retries === 0) {
        console.log("Everything is done yo. It took " + new duration(startTime).toString("%Ss.%Ls") + " seconds to run.");
        done();
      } else if (_.isEmpty(failedTasks)) { 
        console.log("Everything is done yo, all tests pasted a retrying some " + retries + " times. It took " + new duration(startTime).toString("%Ss.%Ls") + " seconds to run.");
        done();
      } else if (!_.isEmpty(failedTasks) && retries >= maxRetries) {
        console.log("Everything is done yo, but some tests failed. It took " + new duration(startTime).toString("%Ss.%Ls") + " seconds to run.");
        console.log("Failed Tests: ", failedTasks);
        done();
      } else {
        retries++;
        pushToQueue(queue, failedTasks);
        failedTasks = {};
      }
    };

    pushToQueue(queue, queueConfig);
  });
};
