
var jsdom = require('jsdom');
var fs = require('fs');
var Q = require('q');
var path = require('path');

// This snippet grants all permissions necessary for the app to access the BrowserSync Server and thus enables us to do LiveReload
var CSP_SNIPPET = "\n\n\n<!-- BEGIN -- Added by cordova-plugin-livereload--> \n<meta http-equiv=\"Content-Security-Policy\" content=\"default-src *; style-src * 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *;\"> \n <!-- END -- Added by cordova-plugin-livereload -->\n\n\n";

module.exports = function(indexHTMLPage) {
    
    this.indexHTMLPage = indexHTMLPage;
    this.indexHTMLContent = fs.readFileSync(indexHTMLPage, "utf-8");
    
    var self = this;
    this.Update = function() {

	var deferred = Q.defer();
	var jquery = fs.readFileSync(path.join(__dirname, "..", "jquery", "./jquery-1.11.1.js"), "utf-8");

	jsdom.env(
    	    {
		html: self.indexHTMLContent,
		src: [jquery],
		done: function (err, window) {
		    var $ = window.$;
		    
		    // Delete the CSP tag included by the current app
		    $("meta[http-equiv=Content-Security-Policy]").remove();
		    
		    // Replace the CSP tag by one that will allow access to the remote BrowserSync server
		    $('head').append(CSP_SNIPPET);

		    var EOL = require('os').EOL;
		    var newHtmlContent = '<!DOCTYPE html>' + EOL + '<html>' +  EOL + $('html').html() + EOL + '</html>';

		    fs.writeFileSync(self.indexHTMLPage, newHtmlContent);
		    
		    deferred.resolve({
			indexHTMLPage: self.indexHTMLPage,
			oldContent: self.indexHTMLContent,
			newContent: newHtmlContent
		    });
		}
	    }
	);
	
	return deferred.promise;
    };
};
