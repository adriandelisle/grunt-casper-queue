/*
 * grunt-casper-queues
 *
 *
 * Copyright (c) 2015 Adrian De Lisle
 * Licensed under the MIT license.
 */

'use strict';

var child_process = require('child_process');
var async = require('async');

var casperRun = function () {
    return child_process.execSync("ls", {encoding: "utf8"});
}

module.exports = function (grunt) {
    grunt.registerMultiTask('casper_queues', 'Run casperjs tess in the cli in parallel queues', function () {
        var options = this.options();
        var queue = options.queue;
        console.log("Queue: " + JSON.stringify(queue, null, 2));

        console.log(casperRun());
    });
};
