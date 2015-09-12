var jsdom = require('jsdom');
var fs = require('fs');
var Q = require('q');
var path = require('path');


module.exports = function(indexHTMLPage) {

    this.indexHTMLPage = indexHTMLPage;
    this.indexHTMLContent = fs.readFileSync(indexHTMLPage, "utf-8");

    var self = this;
    this.Remove = function() {

        var deferred = Q.defer();
        var jquery = fs.readFileSync(path.join(__dirname, "..", "..", "third_party", "jquery", "./jquery-1.11.1.js"), "utf-8");

        jsdom.env({
            html: self.indexHTMLContent,
            src: [jquery],
            done: function(err, window) {
                var $ = window.$;

                // Delete the CSP tag included by the current app
                $("meta[http-equiv=Content-Security-Policy]").remove();

                var EOL = require('os').EOL;
                var newHtmlContent = '<!DOCTYPE html>' + EOL + '<html>' + EOL + $('html').html() + EOL + '</html>';

                fs.writeFileSync(self.indexHTMLPage, newHtmlContent);

                deferred.resolve();
            }
        });

        return deferred.promise;
    };
};
