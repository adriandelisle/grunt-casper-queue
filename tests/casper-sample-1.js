// googletesting.js
casper.test.begin('Bing search retrieves 10 or more results', 2, function suite (test) {
    casper.start('http://www.bing.com/', function () {
        test.assertExists('form[action="/searchi"]', 'main form is found');
        this.fill('form[action="/search"]', {
            q: 'casperjs'
        }, true);
    });

    casper.then(function () {
        test.assertUrlMatch(/q=casperjs/, 'search term has been submitted');
    });

    casper.run(function () {
        test.done();
    });
});
