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
var casperBin = "node_modules/casperjs/bin/casperjs";

var casperRun = function (file, xunit, args) {
    file = path.resolve(process.cwd(), file);
    xunit = "--xunit=" + path.resolve(process.cwd(), xunit);

    args.unshift("test");
    args.push(file);
    args.push(xunit);
    console.log(casperBin);
    console.log(args);

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
    grunt.registerMultiTask('casper_queues', 'Run casperjs tess in the cli in parallel queues', function () {
        console.log(grunt.option.flags());
        var options = this.options();
        var queue = options.queue;
        var args = options.args;
        console.log("Queue: " + JSON.stringify(queue, null, 2));

        queue.general.forEach(function (test) {
            console.log(casperRun(test.file, test.xunit, args.slice()));
        });
    });
};
