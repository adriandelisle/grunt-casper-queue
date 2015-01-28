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
  child_process.execSync("ls");
}

module.exports = function (grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('casper_queues', 'Run casperjs tess in the cli in parallel queues', function () {
    console.log("Queues: " + this.queues);

  });
};
