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

var args = [];

var casperRun = function (test, callback) {
  var testArgs = args.slice()
  var file = path.resolve(process.cwd(), test.file);
  var xunit = "--xunit=" + path.resolve(process.cwd(), test.xunit);
  
  testArgs.unshift("test");
  testArgs.unshift(casperBin);
  testArgs.push(file);
  testArgs.push(xunit);

  var command = testArgs.join(" ");

  console.log(command);

  var result = exec(command, {encoding: "utf8", timeout: 30000}, function (error, stdout, stderr) {
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
    args = options.args;
    var done = this.async();

    var queue = async.queue(function (task, callback) {
      console.log("Starting queue: ", task.name);
      var taskStartTime = new Date();
      
      async.eachSeries(task.tests, casperRun, function (err) {
        if (err) {
          console.log("Something when wrong: ", err);
        } else {
          console.log("Test set: " + task.name + " took " + new duration(taskStartTime).toString("%Ss.%Ls") + " seconds to run.");
        }
        callback(); //required for queue task to be considered done
      });
    }, 2);

    queue.drain = function () {
      console.log("Everything is done yo. It took " + new duration(startTime).toString("%Ss.%Ls") + " seconds to run.");
      done();
    };

    _.each(queueConfig, function (tasks, name) {
      queue.push({'name': name, 'tests': tasks}, function (err) {
        if (err) {
          console.log("Error processing queue", name);
        } else {
          console.log("Finished queue: ", name);
        }
      });
    });
  });
};
