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

/**
 * @constructor
 * @param {string} projectRoot - root folder of the project
 * @param {string} platformWWW - www directory of the platform
 * @param {Object} opts - Options to initialize LiveReload with
 * @param {Boolean} opts.openBrowser - should a browser window be launched after browserSync is initialized ? 
 * @param {Object} context - Cordova's context object that gets passed to plugins
 */
function LiveReload(projectRoot, platformWWW, opts, context) {

    if (!opts) {
        opts = {
            openBrowser: false
        };
    }

    this.context = context;

    // Set default options if necessary
    this.opts = opts;
    this.opts.openBrowser = opts.openBrowser || false;

    // ToDO: provide good documentation on how to resolve CORS issue in a pre-existing project.,
    // ToDO: provide gulp replace scripts to change urls
    // ToDO: Document livereload.json file to enable proxying of urls to get around CORS. livereload config file
    this.projectRoot = projectRoot;
    this.livereloadConfigFile = path.join(this.projectRoot, 'livereload.json');
    this.www_dir = path.join(this.projectRoot, 'www');
    platformWWWDir = platformWWW;
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
        var middlewares = [];
        var proxy_middlewares = process_proxy_middlewares(this.livereloadConfigFile);
        middlewares = proxy_middlewares.concat(middlewares);

        browserSync.watch(path.join(self.www_dir, '**/*.*'), {}, function(event, files) {

            if (event !== 'change') {
                return;
            }

            // run prepare before reloading.
            Q().then(function() {
                self.context.cordova.prepare();
            }).then(function() {
                browserSync.reload(files);
            });
        });

        // Initialize the browser-sync instance
        browserSync.init({
            server: {
                baseDir: self.projectRoot,
                directory: true,
                middleware: middlewares
            },
            files: path.join(self.www_dir, '**/*.*'),
            open: (self.opts.openBrowser || false),
            snippetOptions: {
                rule: {
                    match: /<\/body>/i,
                    fn: function(snippet, match) {
                        return monkeyPatch() + snippet + match;
                    }
                }
            }
        }, function(err, bs) {

            // Once BrowserSync is ready, resolve the promise

            if (err) {
                deferred.reject(err);
            }
            var server_url = bs.options.getIn(['urls', 'external']);
            deferred.resolve(server_url);
        });

        // Expose this so that devs can use it in their workflows (gulp, grunt, etc...)
        self.BrowserSyncInstance = browserSync;

    }).then(function() {
        return deferred.promise;
    });
}

// returns an array of middlewares
// ToDO: bug with 2 routes: /demoserv & /demoserv2
function process_proxy_middlewares(livereloadConfigFile) {
    var middlewares = [];
    if (!fs.existsSync(livereloadConfigFile)) {
        return middlewares;
    }

    var data;

    try {
        data = JSON.parse(fs.readFileSync(livereloadConfigFile, 'utf-8'));
    } catch (e) {
        throw new Error('Error while parsing the file ' + livereloadConfigFile + '. Check its syntax.');
    }

    if (!data.hasOwnProperty('proxies') || !data.proxies) {
        return middlewares;
    }

    // ToDO: test with https, http, wrong link, dead link
    data.proxies.forEach(function(proxy) {
        var proxyOptions = url.parse(proxy.endpoint);
        proxyOptions.route = proxy.route;
        middlewares.push(proxyMiddleware(proxyOptions));
    });

    return middlewares;
}

/**
 * Private function that adds the code snippet to deal with reloading
 * files when they are served from platform folders
 * This is necessary to allow clicks & scrolls (one of BrowserSync's functionalities) to function well across
 *    different platforms (e.g: IOS and Android)
 */
function monkeyPatch() {
    var script = function() {
        window.__karma__ = true;
        (function patch() {
            if (typeof window.__bs === 'undefined') {
                window.setTimeout(patch, 500);
            } else {
                var oldCanSync = window.__bs.prototype.canSync;
                window.__bs.prototype.canSync = function(data, optPath) {
                    data.url = window.location.pathname.substr(0, window.location.pathname.indexOf('/www')) + data.url.substr(data.url.indexOf('/www'));
                    return oldCanSync.apply(this, [data, optPath]);
                };
            }
        }());
    };
    return '<script>(' + script.toString() + '());</script>';
}
