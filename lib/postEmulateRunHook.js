/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */

var Q = require('q');
var events = require('./utils/events');
var os = require('os');
var logger = require('./utils/logger');
var helpers = require('./utils/helpers');
var lib = require('./index');

module.exports = function(context) {

    // Only continue is LiveReload is up and running
    if(!lib.isLiveReloadActive()) {
        return Q();
    }

    // If the command is livereload-compatible, and we are running this function, 
    // it means the server was successfully started.
    // Therefore, let the user know how he can kill the LiveReload/BrowserSync server
    var msg = 'LiveReload server running: ' + os.EOL + 'To kill it, please use: "CTRL+C" ' + os.EOL;
    logger.show(msg);
    return Q();
};
