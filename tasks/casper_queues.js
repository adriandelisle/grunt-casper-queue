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
var casperBin = "node_modules/casperjs/bin/casperjs test";

var casperRun = function (file, xunit, args) {
    file = path.resolve(process.cwd(), file);
    xunit = "--xunit=" + path.resolve(process.cwd(), xunit);
    var command = casperBin + " " + args.join(" ") + " " + file + " " + xunit;
    console.log(command);
    return execSync(command, {encoding: "utf8", timeout: 30000});
};

module.exports = function (grunt) {
    grunt.registerMultiTask('casper_queues', 'Run casperjs tess in the cli in parallel queues', function () {
        console.log(grunt.option.flags());
        var options = this.options();
        var queue = options.queue;
        var args = options.args;
        console.log("Queue: " + JSON.stringify(queue, null, 2));

        queue.general.forEach(function (test) {
            console.log(casperRun(test.file, test.xunit, args));
        });
    });
};
