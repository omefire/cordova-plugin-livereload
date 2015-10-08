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
 * @param {Object} opts - Options to initialize LiveReload with
 * @param {Boolean} opts.openBrowser - should a browser window be launched after browserSync is initialized ? 
 * @param {Object} cb - Function to be called after every change is detected
 */
module.exports = function(projectRoot, platformWWWs, options, cb) {
    return new LiveReload(projectRoot, platformWWWs, options, cb);
};

// Main functions exposed: StartServer, StopServer
