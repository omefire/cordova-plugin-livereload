debugger;
var Q = require('q');
var promiseUtils = require('./promise-util');
var ConfigParser = require('./configparser/ConfigParser');
var events = require('./events');
var path = require('path');

// ToDO: Remove the whole platforms directory once the following changes land into cordova-lib's codebase :
//            https://github.com/cordova/cordova-discuss/pull/12
var platformsAPI = require('./platforms/platforms');

// ToDO: run 'cordova run --livereload --device' multiple times in a series
// ToDO: run 'cordova run --device' after '--livereload' and vice-versa
// ToDO: write integration tests so that when cordova-lib API changes, we detect those changes (e.g: https://github.com/cordova/cordova-discuss/pull/12)
module.exports = function(context) {

    var options = context.opts;
    var projectRoot = context.opts.projectRoot;

    if (!options.livereload) {
        return Q();
    }


    // ToDO: Make it so that we don't need to change anything in cordova-cli to enable a flag in the plugin : https://github.com/MSOpenTech/cordova-cli/commits/LiveReload
    // ToDO: for `cordova run android --device --livereload` to work, we need to have the flag enabled in CLI : https://github.com/MSOpenTech/cordova-cli/commits/LiveReload

    // ToDO: document Windows 10 only is supported
    // ToDO: Test on Windows 10 & ios

    // ToDO: Check for BrowserSync requirements (Python 2.7, node-gyp ?) : http://www.browsersync.io/docs/#windows-users
    // ... If requirements not yet installed, display warnings to developer

    // ToDO: Write docs as to how to install requirements

    // ToDO: Integration with gulp + docs + examples

    // Start LiveReload on all specified platforms serially, so that we don't collide over free ports
    // ... Also, if any platform fails, print a warning and carry on with the other ones.

    // When doing livereload, at least one platform has to successfully launch, otherwise we just abort ...
    var anyPlatformSucceeded = false;

    return Q()
        .then(function() {
            return promiseUtils.Q_chainmap_graceful(options.platforms, function(platform) {
                var platformPath = path.join(projectRoot, 'platforms', platform);
                var parser = platformsAPI.getPlatformProject(platform, platformPath);
                var platform_www = parser.www_dir();

                var LiveReload = require('./livereload');
                return new LiveReload(projectRoot, platform_www, options).StartServer().then(function(server_url) {
		    debugger;
                    var configParser = new ConfigParser(parser.config_xml());
                    configParser.setContentSource(server_url);
                    configParser.write();
                    anyPlatformSucceeded = true;
                    return Q();
                });
            }, function(err) {
                events.emit('warn', err);
            });
        })
        .then(function() {
            // When doing livereload, at least one platform has to successfully launch, otherwise we just abort ...
            // ToDO: this code makes assumptions about inner workings of the 'run' command inside cordova-lib
            if (!anyPlatformSucceeded) {
                return Q.reject('Livereload failed on all platforms, thus the "run" process is being aborted ... ');
            }
            return Q();
        });
};
