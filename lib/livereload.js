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
var events = require('./utils/events');

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

    this.projectRoot = projectRoot;
    this.www_dir = path.join(this.projectRoot, 'www');
    platformWWWDir = platformWWW;
    this.StartServer = StartServer;
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
            return self.context.cordova.raw.prepare().then(function() {
                // Remove CSP directive from HTML
                var CSPRemover = require('./utils/CSPRemover');
                var platformIndexLocal = path.join(platformWWWDir, 'index.html');
                var remover = new CSPRemover(platformIndexLocal);
                return remover.Remove();
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
            deferred.resolve(server_url);
        });

        // Expose this so that devs can use it in their workflows (gulp, grunt, etc...)
        self.BrowserSyncInstance = browserSync;

    }).then(function() {
        return deferred.promise;
    });
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
