/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var path = require('path');
var Q = require('q');
var fs = require('fs');
var url = require('url');
var events = require('./events');
var liveReloadUtils = require('./utils');
var UAParser;
var proxyMiddleware;

var projectRoot,
    browserSync,
    platformWWWDir; 

module.exports = LiveReload;

// projectRoot: root folder of the project
// platformWWW: www directory of the platform
// opts: options.
//    -openBrowser: should a browser window be launched after browserSync is initialized ?
function LiveReload(projectRoot, platformWWW, opts) {
    
    if (!opts) {
        opts = {
            openBrowser: false
        };
    }

    // Set default options if necessary
    this.opts = opts;
    this.opts.openBrowser = opts.openBrowser || false;

    // ToDO: Fix CSP on the app that gets loaded, so that things work : snippetOptions
    // ToDO: provide good documentation on how to resolve CORS issue in a pre-existing project.,
    // ToDO: provide gulp replace scripts to change urls
    // ToDO: Document livereload.json file to enable proxying of urls to get around CORS. livereload config file
    this.projectRoot = projectRoot;
    this.livereloadConfigFile = path.join(this.projectRoot, 'livereload.json'); 
    this.www_dir = path.join(this.projectRoot, 'www');
    platformWWWDir = platformWWW; // ToDO: better names for www dirs ?
    this.StartServer = StartServer;
};


function StartServer() {

    var self = this;
    var deferred = Q.defer();

    
    return Q().then(function() {
	// ToDO: Rework this piece of code to remove deps installation : no longer needed as we do it right after plugin addition
	// Require these modules after we're sure they've been installed
	UAParser = require('ua-parser-js');
	proxyMiddleware = require('proxy-middleware');
	browserSync = require('browser-sync').create();
	
	// Process proxies
	var middlewares = [cordova_middleware];
	var proxy_middlewares = process_proxy_middlewares(this.livereloadConfigFile);
	middlewares = proxy_middlewares.concat(middlewares); 

	// Initialize the browser-sync instance
	browserSync.init({

	    //ToDO: mention this in doc: that all files within all folders are being watched
            files: [path.join(self.www_dir, '**/*.css'), path.join(self.www_dir, '**/*.html'), path.join(self.www_dir, '**/*.js')], 
            server: [self.www_dir], 

            /**
             * Redirect requests for the following files/folders to the appropriate locations:
             *  - cordova.js
             *  - cordova_plugins.js
             *  - plugins/*
             */
            middleware: middlewares, 
            open: (self.opts.openBrowser || false)
	}, function(err, bs) {
            var server_url = bs.options.getIn(['urls', 'external']); 
	    
	    // Once BrowserSync is ready, resolve the promise
            deferred.resolve(server_url); 
	});

	// Expose this so that devs can use it in their workflows (gulp, grunt, etc...)
	self.BrowserSyncInstance = browserSync;

    }).then(function(){
	return deferred.promise;
    });
}

// returns an array of middlewares
// ToDO: bug with 2 routes: /demoserv & /demoserv2
function process_proxy_middlewares(livereloadConfigFile) {
    var middlewares = [];
    if(!fs.existsSync(livereloadConfigFile)){
	return middlewares;
    }

    var data;

    try {
	data = JSON.parse(fs.readFileSync(livereloadConfigFile, 'utf-8'));
    } catch(e) {
	throw new Error('Error while parsing the file ' + livereloadConfigFile + '. Check its syntax.');
    }

    if(!data.hasOwnProperty('proxies') || !data.proxies){
	return middlewares;
    }

    // ToDO: test with https, http, wrong link, dead link
    data.proxies.forEach(function(proxy){
	var proxyOptions = url.parse(proxy.endpoint); 
	proxyOptions.route = proxy.route;
	middlewares.push(proxyMiddleware(proxyOptions));
    });
    
    return middlewares;
}

function cordova_middleware(req, res, next) {
    var parsed = require('url').parse(req.url);
    var reg1 = new RegExp('cordova.js');
    var reg2 = new RegExp('cordova_plugins.js');
    var reg3 = new RegExp('plugins/*');

    // If the request looks like any of the following, render the requested file from the appropriate platform folder
    if (reg1.test(parsed.pathname) || reg2.test(parsed.pathname) || reg3.test(parsed.pathname)) {
        var parser = new UAParser();
        parser.setUA(req.headers['user-agent']);

        var platform = parser.getResult().os.name;

        // ToDO: Test: what if the platform requested is not installed ?
        // ToDO: Test: what if the platform requested has already been deleted from the filesystem ?
        // ToDO: Test: what if the platform requested : search for other test cases
        // ToDO: Test: Multiple platforms. `cordova run android ios --device --livereload`

        var platformDir = platformWWWDir; //'/home/omefire/Projects/Force57/Uber-Customer/platforms/android/assets/www';  
        var fileToRead = path.join(platformDir, req.url);

        res.setHeader('Content-Type', 'text/javascript');
        var fileContent = require('fs').readFileSync(fileToRead).toString();
        res.end(fileContent);
    }
    next();
}
