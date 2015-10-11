/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */


var path = require('path');
var configParser = require('./configParser');

// Checks whether a command is compatible with livereload
// Currently, Only the following commands are compatible with LiveReload : `* (run|emulate) android -- --livereload`, `* (run|emulate) android --livereload`
//   Examples:
//     - `cordova run android -- --livereload` 
//     - `phonegap run android -- --livereload`
//     - `cordova run android --livereload`
//     - `cordova emulate android -- --livereload`
//     - `cordova emulate android --livereload`
//     - `taco emulate android --livereload`
//     - `phonegap emulate android --livereload`
module.exports.IsCmdLiveReloadCompatible = function(context) {

    // Allow livereload to be started by running: `cordova run android --livereload` or by running `cordova run android -- --livereload`
    if (!context.opts.livereload && (context.opts.options.indexOf('--livereload') === -1)) {
        return false;
    }

    // Has the user issued a livereload compatible command ? e.g: run or emulate
    var cordovaRunRegex = /(.*)(run|emulate)(.*)/i;
    var isCordovaRunCmd = cordovaRunRegex.test(context.cmdLine);

    return isCordovaRunCmd ? true : false;
};

// Retrieve the start page for a cordova project, given the project's root directory
module.exports.GetStartPage = function(projectRoot) {
    var configXML = path.join(projectRoot, 'config.xml');
    var startPage = configParser.GetStartPage(configXML);
    return startPage;
};

module.exports.ParseOptions = function(opts) {
    var result = {};
    opts.forEach(function(opt) {
        var parts = opt.split(/=/);
        var option = parts[0];
        var value = parts[1];

        // Remove dashes. e.g: --livereload => livereload
        // Remove space surrounding options. e.g: --ignore= build/**/*.* => --ignore=build/**/*.*
        var cleanedOption = option.replace(/^-+/, '');
        if (!value) {
            result[cleanedOption] = true;
            return;
        }
        result[cleanedOption.replace(/\s+/, '')] = (value && value.replace(/\s+/, '')) || true;
    });
    return result;
};
