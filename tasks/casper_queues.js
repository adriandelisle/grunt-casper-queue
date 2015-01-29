/*
 * grunt-casper-queues
 *
 *
 * Copyright (c) 2015 Adrian De Lisle
 * Licensed under the MIT license.
 */

'use strict';

var execSync = require('child_process').execSync;
var async = require('async');
var path = require('path');
var casperBin = "node_modules/casperjs/bin/casperjs test --verbose";

var casperRun = function (file) {
    file = path.resolve(process.cwd(), file);
    var command = casperBin + " " + file;
    console.log(command);
    return execSync(command, {encoding: "utf8"});
};

module.exports = function (grunt) {
    grunt.registerMultiTask('casper_queues', 'Run casperjs tess in the cli in parallel queues', function () {
        var options = this.options();
        var queue = options.queue;
        console.log("Queue: " + JSON.stringify(queue, null, 2));

        queue.general.forEach(function (test) {
          console.log(casperRun(test.file));
        });
    });
};
