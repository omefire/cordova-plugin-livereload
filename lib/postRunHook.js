var Q = require('q');
var events = require('./utils/events');
var os = require('os');

module.exports = function(context) {

    var pluginName = require('../package.json').name;

    // Let the user know how he can kill the LiveReload/BrowserSync server
    var msg = os.EOL;
    msg += pluginName + ' - ' + 'LiveReload server running: ' + os.EOL + 'To kill it, please use: "CTRL+C" ' + os.EOL;

    console.log(msg);

    return Q();
};
