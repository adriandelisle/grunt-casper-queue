// googletesting.js
casper.test.begin('Google search retrieves 10 or more results', 2, function suite (test) {
    casper.start('http://www.google.fr/', function () {
        test.assertExists('form[action="/search"]', 'main form is found');
        this.fill('form[action="/searchi"]', {
            q: 'casperjs'
        }, true);
    });

    casper.then(function () {
        test.assertUrlMatch('http://www.google.fr/', 'search term has been submitted');
    });

    casper.run(function () {
        test.done();
    });
});
