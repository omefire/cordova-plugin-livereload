/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */

var LiveReload = require('./livereload');

/**
 * @constructor
 * @param {string} projectRoot - root folder of the project
 * @param {string} platformWWW - www directories of the platforms
 * @param {Object} options - Options to initialize LiveReload with - These are to be passed to the underlying BrowserSync.
 *                           See http://www.browsersync.io/docs/options/ for documentation
 */
module.exports = function(projectRoot, platformWWWs, options) {
    return new LiveReload(projectRoot, platformWWWs, options);
};

// Main functions exposed: StartServer, StopServer
