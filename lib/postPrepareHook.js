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
var CSPRemover = require('./utils/CSPRemover');
var url = require('url');
var multiPlatforms = require('./utils/platforms');
var logger = require('./utils/logger');
var helpers = require('./utils/helpers');
var ATSRemover = require('./utils/ATSRemover');

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
        livereloadOptions = helpers.parseOptions();


    // If user has entered whitespaces surrounding '--ignore', 
    // ... we end up having helpers.parseOptions() return 'ignore' with value true instead of a string,
    // ... which can't be used as a string. So, Let's check for those cases
    // e.g of error cases: 
    //      `cordova run android -- --livereload --ignore, // with no path to ignore
    //      `cordova run android -- --livereload --ignore= css, // with space after the '=' sign
    //      etc...
    // ToDO: ignore whitespaces surrounding the --ignore option or at least display a warning message to user
    var ignoreOption = undefined;
    if (livereloadOptions.ignore) {
        ignoreOption = path.join(projectRoot, 'www', livereloadOptions.ignore);
    }

    var lr = new LiveReload(projectRoot, platform_wwws, {
        files: [{
            match: [path.join(projectRoot, 'www', '**/*.*')],
            fn: function(event, file) {
                // After a file changes, first run `cordova prepare`, then reload.
                context.cordova.raw.prepare().then(function() {
                    // Remove CSP directive from HTML
                    platform_wwws.forEach(function(platWWWDir) {
                        var platformIndexLocal = path.join(platWWWDir, startPage);
                        var remover = new CSPRemover(platformIndexLocal);
                        remover.Remove();
                    });
                    return Q();
                }).then(function() {
                    if (event === 'change') {
                        lr.browserSync.reload(file);
                        return Q();
                    }

                    // If new files got added or deleted, reload the whole app instead of specific files only
                    // e.g: index.html references a logo file 'img/logo.png'
                    // deleting the 'img/logo.png' file will trigger a reload that will remove it from the rendered app
                    // likewise, adding the 'img/logo.png' file will trigger it to be shown on the app
                    lr.browserSync.reload();
                    return Q();
                }).fail(function(err) {
                    var msg = ' - An error occurred: ' + err;
                    logger.show(msg);
                    lr.stopServer();
                });
            }
        }],
        watchOptions: {

            // If user specified files/folders to ignore (via `cordova run android -- --livereload --ignore=build/**/*.*`), ignore those files
            // ... Otherwise, don't ignore any files (That's the default). The function below achieves that goal.
            ignored: ignoreOption || function(string) {
                return false;
            },

            // Ignore the initial add events .
            // Don't run prepare on the initial addition of files,
            // Only do it on subsequent ones
            ignoreInitial: true
        },
        tunnel: livereloadOptions.tunnel || false,
        ghostMode: livereloadOptions.ghostMode || true
    });

    return lr.startServer().then(function(server_url) {
        return promiseUtils.Q_chainmap(options.platforms, function(plat) {
            var platformIndexUrl = url.resolve(server_url, path.join(multiPlatforms.getPlatformWWWFolder(plat), startPage));
            helpers.ChangeStartPage(projectRoot, plat, platformIndexUrl);
        });
    }).then(function() {
        return promiseUtils.Q_chainmap(options.platforms, function(plat) {
            var platWWWFolder = multiPlatforms.getPlatformWWWFolder(plat);

            var platformIndexLocal = path.join(projectRoot, platWWWFolder, startPage);
            var cspRemover = new CSPRemover(platformIndexLocal);
            return cspRemover.Remove().then(function() {
                var atsRemover = new ATSRemover(projectRoot, plat);
                return atsRemover.Remove();
            });
        });
    }).then(function() {
        // LiveReload is up and running
        helpers.setLiveReloadToActive();
    }).fail(function(err) {
        var msg = pluginName + ' - An error occurred: ' + err;
        logger.show(msg);

        // Stop the current process
        lr.stopServer();
    });
};
