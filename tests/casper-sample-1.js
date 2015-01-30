// googletesting.js
casper.test.begin('Bing search retrieves 10 or more results', 5, function suite(test) {
    casper.start("http://www.bing.com/", function() {
        test.assertTitle("Bing", "Bing homepage title is the one expected");
        test.assertExists('form[action="/search"]', "main form is found");
        this.fill('form[action="/search"]', {
            q: "casperjs"
        }, true);
    });

    casper.then(function() {
        test.assertTitle("casperjs - Bing", "bing title is ok");
        test.assertUrlMatch(/q=casperjs/, "search term has been submitted");
        test.assertEval(function() {
            return __utils__.findAll("li.b_algo").length >= 10;
        }, "bing search for \"casperjs\" retrieves 10 or more results");
    });

    casper.run(function() {
        test.done();
    });
});
