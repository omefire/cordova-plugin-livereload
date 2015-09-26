var Q = require('q');
var promiseUtils = require('./utils/promise-util');
var events = require('./utils/events');
var path = require('path');
var fs = require('fs');
var CSPRemover = require('./utils/CSPRemover');
var url = require('url');
var multiPlatforms = require('./utils/multi-platforms');
var configParser = require('./utils/config-parser');

module.exports = function(context) {

    var pluginName = require('../package.json').name;
    var options = context.opts;
    var projectRoot = context.opts.projectRoot;

    // Allow livereload to be started by running: `cordova run android --livereload` or by running `cordova run android -- --livereload`
    if (!options.livereload && (options.options.indexOf('--livereload') === -1)) {
        return Q();
    }

    // Validate whether all platforms are currently supported
    // If a platform is not supported by the plugin, display an error message and don't process it any further
    options.platforms.forEach(function(plat, index, platforms) {
        if (!multiPlatforms.isPlatformSupported(plat)) {
            events.emit('warn', pluginName + ':  The "' + plat + '" platform is not supported.');
            platforms.splice(index, 1);
        }
    });

    // If none of the supplied platforms are supported, stop and return an error
    if (options.platforms === undefined || options.platforms.length == 0) {
        return Q.reject(pluginName + ': None of the platforms supplied are currently supported.');
    }

    var platform_wwws = options.platforms.map(function(plat) {
        return path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(plat)); 
    });


    var LiveReload = require('./livereload');
    return new LiveReload(projectRoot, platform_wwws, options, context.cordova.raw.prepare).StartServer().then(function(server_url) {
        return promiseUtils.Q_chainmap(options.platforms, function(plat) {
            var platformIndexUrl = url.resolve(server_url, path.join(multiPlatforms.getPlatformWWWFolder(plat), 'index.html'));
            var configXml = path.join(projectRoot, multiPlatforms.getConfigFolder(plat), 'config.xml');
            configParser.ChangeContentSource(platformIndexUrl, configXml);
        });
    }).then(function() {
        return promiseUtils.Q_chainmap(options.platforms, function(plat) {
            var platformIndexLocal = path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(plat), 'index.html');
            var cspRemover = new CSPRemover(platformIndexLocal);
            return cspRemover.Remove();
        });
    }).fail(function(err) {
        var msg = pluginName + ': An error occurred' + JSON.stringify(err);
        events.emit('warn', err);
        return Q.reject(msg);
    });
};
