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

    debugger;
    var pluginName = require('../package.json').name;
    var options = context.opts;
    var projectRoot = context.opts.projectRoot;

    // Allow livereload to be started by running: `cordova run android --livereload` or by running `cordova run android -- --livereload`
    if (!options.livereload && (options.options.indexOf('--livereload') === -1)) {
        return Q();
    }

    // Test: what if android is supported on my box, but not ios ? `cordova run android ios -- --livereload` => let `cordova run` sort this out
    // When doing livereload, at least one platform has to successfully launch, otherwise we just abort ...
    //var anyPlatformSucceeded = false;

    // Validate whether all platforms are currently supported
    // If a platform is not supported by the plugin, display an error message and don't process it any further
    // Test
    // What if there's an error here ? out of Q promises ? how do we report that to the user ?
    options.platforms.forEach(function(plat, index, platforms) {
        //if (!isPlatformSupported(plat)) {
        if (!multiPlatforms.isPlatformSupported(plat)) {
            events.emit('warn', pluginName + ':  The "' + plat + '" platform is not supported.');
            platforms.splice(index, 1);
        }
    });

    // If none of the supplied platforms are supported, stop and return an error
    if (options.platforms === undefined || options.platforms.length == 0) {
        // Test
        // Get name from package.json
        return Q.reject(pluginName + ': None of the platforms supplied are currently supported.');
    }

    var platform_wwws = options.platforms.map(function(plat) {
        return path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(plat)); //WWW_FOLDER[plat]);
    });


    var LiveReload = require('./livereload');

    // var configXmls = options.platforms.map(function(plat) {
    //     return path.join(projectRoot, CONFIG_LOCATION[plat], 'config.xml');
    // });

    //ToDO: If any platform fails, continue processing
    //ToDO: Run platforms in parallel
    //ToDO: all CSP directives 
    return new LiveReload(projectRoot, platform_wwws, options).StartServer().then(function(server_url) {
        return promiseUtils.Q_chainmap(options.platforms, function(plat) {
            var platformIndexUrl = url.resolve(server_url, path.join(multiPlatforms.getPlatformWWWFolder(plat), 'index.html'));
            var configXml = path.join(projectRoot, multiPlatforms.getConfigFolder(plat), 'config.xml');
            //changeConfigXml(platformIndexUrl, configXml);
            configParser.ChangeContentSource(platformIndexUrl, configXml);
        });
    }).then(function() {
        // ToDO: do this in parallel
        // Remove CSP to allow calls to BrowserSync HTTP server
        // what if an exception occurs here ? is it reported well ?
        return promiseUtils.Q_chainmap(options.platforms, function(plat) {
            var platformIndexLocal = path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(plat), 'index.html');
            var cspRemover = new CSPRemover(platformIndexLocal);
            return cspRemover.Remove();
        });
    }).fail(function(err) {
        // ToDO: what if plugin name changes ?
        // ToDO: what if err is not a string ?
        // ToDO: try out an error scenario
        var msg = pluginName + ': An error occurred' + JSON.stringify(err);
        events.emit('warn', err);
        return Q.reject(msg);
    });
};
