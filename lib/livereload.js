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
var logger = require('./utils/logger');

var projectRoot,
    browserSync,
    platformWWWDirs;

module.exports = LiveReload;

/**
 * @constructor
 * @param {string} projectRoot - root folder of the project
 * @param {string} platformWWW - www directories of the platforms
 * @param {Object} opts - Options to initialize LiveReload with
 * @param {Boolean} opts.openBrowser - should a browser window be launched after browserSync is initialized ? 
 * @param {Object} prepareFn - Cordova's prepare function
 */
function LiveReload(projectRoot, platformWWWs, opts, prepareFn) {

    if (!opts) {
        opts = {
            openBrowser: false
        };
    }

    this.prepareFn = prepareFn;

    // Set default options if necessary
    this.opts = opts;
    this.opts.openBrowser = opts.openBrowser || false;

    this.projectRoot = projectRoot;
    this.www_dir = path.join(this.projectRoot, 'www');
    platformWWWDirs = platformWWWs;
    this.StartServer = StartServer;
    this.StopServer = StopServer;
};


function StartServer() {

    var self = this;
    var deferred = Q.defer();

    return Q().then(function() {
        browserSync = require('browser-sync').create();

        browserSync.watch(path.join(self.www_dir, '**/*.*'), {}, function(event, files) {

            if (event !== 'change') {
                return;
            }

            // After a file changes, first run prepare, then reload.
            return self.prepareFn().then(function() {

                // Remove CSP directive from HTML
                var CSPRemover = require('./utils/CSPRemover');
                platformWWWDirs.forEach(function(platDir) {
                    var platformIndexLocal = path.join(platDir, 'index.html');
                    var remover = new CSPRemover(platformIndexLocal);
                    remover.Remove();
                });

                return Q();
            }).then(function() {
                browserSync.reload(files);
            });
        });

        // Initialize the browser-sync instance
        browserSync.init({
            server: {
                baseDir: self.projectRoot,
                directory: true
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

            // In case there is no external url
            // e.g: When the machine is not connected to any network
            if (!server_url) {
                // Usually, this err msg ends up being null in this case.
                var error = new Error('No External URLs available. Make sure your computer is connected to a network.' + (err ? err.msg : ''));
                deferred.reject(error);
            }

            deferred.resolve(server_url);
        });

        // Expose this so that devs can use it in their workflows (gulp, grunt, etc...)
        self.BrowserSyncInstance = browserSync;

    }).then(function() {
        return deferred.promise;
    });
}

function StopServer() {
    browserSync.exit();
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
