/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */

var cheerio = require('cheerio');
var fs = require('fs');
var Q = require('q');
var path = require('path');
var CSPParser = require('csp-parse');

module.exports = function(indexHTMLPage) {

    this.indexHTMLPage = indexHTMLPage;
    this.indexHTMLContent = fs.readFileSync(this.indexHTMLPage, "utf-8");

    var self = this;
    this.Update = function() {

        var deferred = Q.defer();

        var $ = cheerio.load(self.indexHTMLContent);

        var cspTag = $("meta[http-equiv=Content-Security-Policy]");

        var cspParser = new CSPParser(cspTag.attr('content'));
        cspParser.add('default-src', 'ws:');
        cspParser.add('default-src', "'unsafe-inline'");

        // Set the CSP tag.content value to the updated policy
        cspTag.attr('content', function() {
            return cspParser.toString();
        });

        var newHtmlContent = $.html(); // HTML content with CSP directives removed

        // Override file with new content by first performing a deletion followed by creating a new file because of a weird bug 
        //   ... where sometimes fs.writeFile(..) doesn't override file content with new text on OSX
        fs.unlink(self.indexHTMLPage, function(err) {
            if (err) {
                deferred.reject(err);
            }

            fs.writeFile(self.indexHTMLPage, newHtmlContent, function(err) {
                if (err) {
                    deferred.reject(err);
                }
                deferred.resolve();
            });

        });

        return deferred.promise;
    };
};
