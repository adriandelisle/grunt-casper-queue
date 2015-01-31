/*
 * grunt-casper-queues
 *
 *
 * Copyright (c) 2015 Adrian De Lisle
 * Licensed under the MIT license.
 */

'use strict';

var spawnSync = require('child_process').spawnSync;
var async = require('async');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var duration = require('duration');

var casperBin = "node_modules/casperjs/bin/casperjs";

var casperRun = function (file, xunit, args) {
  file = path.resolve(process.cwd(), file);
  xunit = "--xunit=" + path.resolve(process.cwd(), xunit);

  args.unshift("test");
  args.push(file);
  args.push(xunit);
  //console.log(casperBin);
  //console.log(args);

  if (!fs.existsSync(casperBin)) {
    console.log("where's casper?");
    return false;
  }

  var result = spawnSync(casperBin, args, {encoding: "utf8", timeout: 30000});
  if (result.error) {
    console.log("*error*: " + result.error);
  } else {
    return result.stdout;
  }
};

module.exports = function (grunt) {
  grunt.registerMultiTask('casper_queues', 'Run casperjs tests in the cli in parallel queues', function () {
    var startTime = new Date();
    var options = this.options();
    var queueConfig = options.queue;
    var args = options.args;
    var done = this.async();

    var queue = async.queue(function (task, callback) {
      console.log("Starting queue: ", task.name);
      var taskStartTime = new Date();

      task.tests.forEach(function (test) {
        var result = casperRun(test.file, test.xunit, args.slice()); //args.slice() makes a copy of the args for casperRun to modify and use
        console.log(result);
        console.log(queue.running());
      });

      console.log("Test set: " + task.name + " took " + new duration(taskStartTime).toString("%Ss.%Ls") + " seconds to run.");
      callback(); //required for queue task to be considered done
    }, 5);

    queue.drain = function () {
      console.log("Everything is done yo. It took " + new duration(startTime).toString("%Ss.%Ls") + " seconds to run.");
    };

    queue.pause();

    console.log(queue.saturated);
    _.each(queueConfig, function (tasks, name) {
      //console.log("Pushing: ", name, tasks);
      queue.push({'name': name, 'tests': tasks}, function (err) {
        if (err) {
          console.log("Error processing queue", name);
        } else {
          console.log("Finished queue: ", name);
        }
      });
    });

    queue.resume();
  });
};
