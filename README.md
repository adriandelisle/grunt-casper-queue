# grunt-casper-queue

> Run casperjs test sets in parallel.

Useful for parallelizing casperjs tests where the tests can be broken down into multiple sets of non-conflicting tests.

ie. A, B, C, 1, 2, 3 are all casperjs tests where A, B, C cannot run at the same time likewise 1, 2, 3 cannot run at the same time, but any of 1, 2, 3 can run while any of A, B, C are running. 
So both sets can run in series at the same time because they do not conflict with each other.

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-casper-queue --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-casper-queue');
```

## The "casper_queue" task

### Overview
In your project's Gruntfile, add a section named `casper_queue` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  casper_queue: {
    options: {
      queueWorkers: x,
      maxRetries: x,
      args: [],
      queue: {
        'test set name': [
          {file: 'test.js', xunit: 'test-report.xml'}
        ]
      }
    }
  },
})
```

### Options

#### options.queue
Type: `Object`
Default value: `undefined`

A configuration object that holds the tests sets to be run.

Example:

```js
{
  google: [
    {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-0.xml'},
    {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-1.xml'},
    {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-2.xml'},
    {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-3.xml'},
    {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-4.xml'}
  ],
  bing: [
    {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-0.xml'},
    {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-1.xml'},
    {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-2.xml'},
    {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-3.xml'},
    {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-4.xml'}
  ]
}
```

#### options.queueWorkers
Type: `Number`
Default value: `1`

The number of test sets that will be run in parallel.

#### options.maxRetries
Type: `Number`
Default value: `1`

The maximum number of times to retry failed tests.

#### options.args
Type: `Array`
Default value: `[]`

An array of strings representing the command line arguments to pass to casperjs.

#### options.casperCwd
Type: `String`
Default value: `undefined`

A string that will set the current working directory of the casper test when run.

### Usage Examples

An example configuration for grunt-casper-queue

```js
casper_queue: {
  test: {
    options: {
      queueWorkers: 2,
      args: [
        '--verbose',
        '--ignore-ssl-errors=yes',
        '--ssl-protocal=any'
      ],
      queue: {
        google: [
          {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-0.xml'},
          {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-1.xml'},
          {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-2.xml'},
          {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-3.xml'},
          {file: 'tests/casper-sample-0.js', xunit: 'test-reports/casper-sample-0-4.xml'}
        ],
        bing: [
          {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-0.xml'},
          {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-1.xml'},
          {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-2.xml'},
          {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-3.xml'},
          {file: 'tests/casper-sample-1.js', xunit: 'test-reports/casper-sample-1-4.xml'}
        ]
      }
    }
  }
}
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
* 20/02/2015    v0.0.8    add the option to set the cwd for the casperjs exec
* 18/02/2015    v0.0.7    typos
* 18/02/2015    v0.0.6    updated readme to reflect current state of the project
* 12/02/2015    v0.0.5    missed renaming the project in one place
* 12/02/2015    v0.0.4    missed renaming the project in one place
* 12/02/2015    v0.0.3    renamed project
* 05/02/2015    v0.0.2    Added a summary of test set times
* 04/02/2015    v0.0.1    initial version of casperjs queues

## License
Copyright (c) 2015 Adrian De Lisle. Licensed under the MIT license.
