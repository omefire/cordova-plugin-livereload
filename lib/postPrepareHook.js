/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */

var Q = require('q');
var logger = require('./utils/logger');
var lr = require('./index');
var helpers = require('./utils/helpers');

// Entry point when we use this as a cordova plugin
module.exports = function (context) {

    // This check prevents commands that call the prepare process,
    // such as: `cordova build android -- --livereload` from starting the LiveReload process
    if (!helpers.IsCmdLiveReloadCompatible(context)) {
        return Q();
    }

    //  Start LiveReload server
    var projectRoot = context.opts.projectRoot;
    var platforms = context.opts.platforms;

    return lr.start(projectRoot, platforms, {
        cb: function (event, file, lrHandle) {
            // After a file changes, first run `cordova prepare`, then reload.
            context.cordova.raw.prepare().then(function () {
                var patcher = new lr.Patcher(projectRoot, platforms);
                return patcher.removeCSP();
            }).then(function () {
                if (event === 'change') {
                    return lrHandle.tryReloadingFile(file);
                }

                // If new files got added or deleted, reload the whole app instead of specific files only
                // e.g: index.html references a logo file 'img/logo.png'
                // deleting the 'img/logo.png' file will trigger a reload that will remove it from the rendered app
                // likewise, adding the 'img/logo.png' file will trigger it to be shown on the app
                return lrHandle.reloadBrowsers();
            }).fail(function (err) {
                var msg = ' - An error occurred: ' + err;
                logger.show(msg);
                lrHandle.stop();
            });
        }
    });
};
