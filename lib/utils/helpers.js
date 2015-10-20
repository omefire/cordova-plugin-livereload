/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */


var path = require('path');
var configParser = require('./configParser');
var glob = require('glob');
var multiPlatforms = require('./platforms');
var fs = require('fs');
var nopt = require('nopt');

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
// Remove this !
module.exports.IsCmdLiveReloadCompatible = function(context, livereloadOptions) {

    // There is a bug in cordova-lib upto at least version 5.3.x that prevents 
    // ... the context object of plugins from passing the -- --livereload flag correctly.
    // ... directly inspecting the process.argv allows us to circumvent that issue.
    var emulateWithLiveReload = ParseOptions(process.argv).livereload;

    // Allow livereload to be started by running: `cordova run android --livereload` or by running `cordova run android -- --livereload`
    var isLiveReload = (context.opts.options.indexOf('--livereload') === -1);
    isLiveReload = isLiveReload || emulateWithLiveReload;
    if (!context.opts.livereload && isLiveReload) {
        return false;
    }

    // Has the user issued a livereload compatible command ? e.g: run or emulate
    var regex = /(.*)(run|emulate)(.*)/i;

    var isCordovaRunOrEmulateCmd = regex.test(context.cmdLine);

    return isCordovaRunOrEmulateCmd ? true : false;
};

// config.xml can be found in the projectRoot directory or within the projectRoot/www folder
module.exports.GetConfigXMLFile = GetConfigXMLFile = function(projectRoot) {
    var rootPath = path.join(projectRoot, 'config.xml');
    var wwwPath = path.join(projectRoot, 'www', 'config.xml');
    if (fs.existsSync(rootPath)) {
        return rootPath;
    } else if (fs.existsSync(wwwPath)) {
        return wwwPath;
    }
    return rootPath;
};

// Retrieve the start page for a cordova project, given the project's root directory
module.exports.GetStartPage = function(projectRoot) {
    var configXML = GetConfigXMLFile(projectRoot);
    var startPage = configParser.GetStartPage(configXML);
    return startPage;
};

module.exports.ChangeStartPage = function(projectRoot, plat, platformIndexUrl) {
    var configXmlFolder = path.join(projectRoot, 'platforms', plat, multiPlatforms.getConfigFolder(plat));
    glob.sync('**/config.xml', {
        cwd: configXmlFolder,
        ignore: '*build/**'
    }).forEach(function(filename) {
        var configXML = path.join(configXmlFolder, filename);
        configParser.ChangeStartPage(platformIndexUrl, configXML);
    });
};

// Parses LiveReload options off of process.argv
module.exports.ParseOptions = ParseOptions = function(processArgv) {

    var knownOpts = {
        'livereload': Boolean,
        'ignore': String
    };

    processArgv = processArgv || process.args;

    debugger;

    var parsedOptions = nopt(knownOpts, {}, processArgv, 2);

    // All livereload options happen after the -- -- 
    // What if we want to enable --livereload in the future ? (instead of -- --livereload) : `cordova run android --livereload`
    // Test all cases !
    var parsedLivereloadOptions = nopt(knownOpts, {}, parsedOptions.argv.remain, 2);

    return {
        run: parsedOptions.argv.original.indexOf('run') > -1,
        emulate: parsedOptions.argv.original.indexOf('emulate') > -1,
        livereload: parsedOptions.livereload || parsedLivereloadOptions.livereload,
        ignore: parsedOptions.ignore || parsedLivereloadOptions.ignore
    };
};
