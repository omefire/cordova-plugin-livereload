var Q = require('q');
var events = require('./utils/events');
var os = require('os');
var logger = require('./utils/logger');

module.exports = function(context) {

    var options = context.opts;

    // Check whether the livereload flag is present
    if (!options.livereload && (options.options.indexOf('--livereload') === -1)) {
        return Q();
    }

    // If the livereload flag is present, and we are running this function, 
    // it means the server was successfully started.
    // Therefores, let the user know how he can kill the LiveReload/BrowserSync server
    var msg = 'LiveReload server running: ' + os.EOL + 'To kill it, please use: "CTRL+C" ' + os.EOL;
    logger.show(msg);
    return Q();
};
