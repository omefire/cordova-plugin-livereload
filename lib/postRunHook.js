var Q = require('q');
var events = require('./utils/events');
var os = require('os');
var logger = require('./utils/logger');
var helpers = require('./utils/helpers');

module.exports = function(context) {

    // Check whether the command being run is livereload-compatible
    if (!helpers.IsCmdLiveReloadCompatible(context)) {
        return Q();
    }

    // If the command is livereload-compatible, and we are running this function, 
    // it means the server was successfully started.
    // Therefore, let the user know how he can kill the LiveReload/BrowserSync server
    var msg = 'LiveReload server running: ' + os.EOL + 'To kill it, please use: "CTRL+C" ' + os.EOL;
    logger.show(msg);
    return Q();
};
