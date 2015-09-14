var cheerio = require('cheerio');
var fs = require('fs');
var Q = require('q');
var path = require('path');
//var Buffer = require('buffer').Buffer;


module.exports = function(indexHTMLPage) {

    this.indexHTMLPage = indexHTMLPage;
    this.indexHTMLContent = fs.readFileSync(indexHTMLPage, "utf-8");

    var self = this;
    this.Remove = function() {

        var deferred = Q.defer(); // Test: when promise fails

        var $ = cheerio.load(self.indexHTMLContent);
        $("meta[http-equiv=Content-Security-Policy]").remove(); // what if csp is in lower character ? 	

        var newHtmlContent = $.html(); // HTML content with CSP directives removed	
        fs.writeFile(self.indexHTMLPage, newHtmlContent, function(err) {
            if (err) {
                deferred.reject(err);
            }
            deferred.resolve();
        });

        return deferred.promise;
    };
};
