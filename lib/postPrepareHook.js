/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */

var Q = require('q');
var promiseUtils = require('./utils/promise-util');
var path = require('path');
var fs = require('fs');
var CSPUpdater = require('./utils/CSPUpdater');
var url = require('url');
var multiPlatforms = require('./utils/platforms');
var configParser = require('./utils/configParser');
var logger = require('./utils/logger');
var helpers = require('./utils/helpers');

module.exports = function(context) {

    var pluginName = require('../package.json').name;
    var options = context.opts;
    var projectRoot = context.opts.projectRoot;

    // This check prevents commands that call the prepare process,
    // such as: `cordova build android -- --livereload` from starting the LiveReload process
    if (!helpers.IsCmdLiveReloadCompatible(context)) {
        return Q();
    }

    // Validate whether all platforms are currently supported
    // If a platform is not supported by the plugin, display an error message and don't process it any further
    options.platforms.forEach(function(plat, index, platforms) {
        if (!multiPlatforms.isPlatformSupported(plat)) {
            var msg = 'The "' + plat + '" platform is not supported.';
            logger.show(msg);
            platforms.splice(index, 1);
        }
    });

    // If none of the supplied platforms are supported, stop and return an error
    if (options.platforms === undefined || options.platforms.length === 0) {
        var msg = 'None of the platforms supplied are currently supported for LiveReload.';
        logger.show(msg);
        return Q.reject(msg);
    }

    var platform_wwws = options.platforms.map(function(plat) {
        return path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(plat));
    });

    var startPage = helpers.GetStartPage(projectRoot),
        LiveReload = require('./livereload'),
        lr = new LiveReload(projectRoot, platform_wwws, options, context.cordova.raw.prepare);

    return lr.StartServer().then(function(server_url) {
        return promiseUtils.Q_chainmap(options.platforms, function(plat) {
            var configXml = path.join(projectRoot, multiPlatforms.getConfigFolder(plat), 'config.xml');
            var platformIndexUrl = url.resolve(server_url, path.join(multiPlatforms.getPlatformWWWFolder(plat), startPage));
            configParser.ChangeStartPage(platformIndexUrl, configXml);
        });
    }).then(function() {
        return promiseUtils.Q_chainmap(options.platforms, function(plat) {
            var platformIndexLocal = path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(plat), startPage);
            var cspUpdater = new CSPUpdater(platformIndexLocal);
            return cspUpdater.Update();
        });
    }).fail(function(err) {
        var msg = pluginName + ' - An error occurred: ' + err;
        logger.show(msg);

        // Stop the current process
        lr.StopServer();
    });
};
