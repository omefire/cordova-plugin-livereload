var Q = require('q');
var promiseUtils = require('./utils/promise-util');
var events = require('./utils/events');
var path = require('path');
var fs = require('fs');
var CSPRemover = require('./utils/CSPRemover');
var url = require('url');

module.exports = function(context) {

    var options = context.opts;
    var projectRoot = context.opts.projectRoot;

    var glob = context.requireCordovaModule('glob');
    var et = context.requireCordovaModule('elementtree');

    // Allow livereload to be started by running: `cordova run android --livereload` or by running `cordova run android -- --livereload`
    if (!options.livereload && (options.options.indexOf('--livereload') === -1)) {
        return Q();
    }

    var WWW_FOLDER = {
        android: 'platforms/android/assets/www',
        ios: 'platforms/ios/www',
        windows: 'platforms/windows/www'
    };

    var CONFIG_LOCATION = {
        android: 'platforms/android/res/xml',
        ios: 'platforms/ios/HelloCordova',
        windows: 'platforms/windows'
    };

    function parseXml(filename) {
        return new et.ElementTree(et.XML(fs.readFileSync(filename, "utf-8").replace(/^\uFEFF/, "")));
    }

    function changeConfigXml(hostedPage, configXML) {
        var filename = configXML;
        configXml = parseXml(filename);
        var contentTag = configXml.find('content[@src]');
        if (contentTag) {
            contentTag.attrib.src = hostedPage;
        }
        // Also add allow nav in case of 
        var allowNavTag = et.SubElement(configXml.find('.'), 'allow-navigation');
        allowNavTag.set('href', '*');
        fs.writeFileSync(filename, configXml.write({
            indent: 4
        }), "utf-8");
        return filename;
    }

    // When doing livereload, at least one platform has to successfully launch, otherwise we just abort ...
    var anyPlatformSucceeded = false;

    return Q()
        .then(function() {

            // Start LiveReload on all specified platforms serially, so that we don't collide over free ports
            // ... Also, if any platform fails, print a warning and carry on with the other ones.
            return promiseUtils.Q_chainmap_graceful(options.platforms, function(platform) {

                var platform_www = path.join(projectRoot, WWW_FOLDER[platform]);
                var configXml = path.join(projectRoot, CONFIG_LOCATION[platform], 'config.xml');

                var LiveReload = require('./livereload');
                return new LiveReload(projectRoot, platform_www, options, context).StartServer().then(function(server_url) {
                    var platformIndexUrl = url.resolve(server_url, path.join(WWW_FOLDER[platform], 'index.html'));
                    changeConfigXml(platformIndexUrl, configXml);
                    return Q();
                }).then(function() {
                    // Remove CSP to allow calls to BrowserSync HTTP server
                    var platformIndexLocal = path.join(platform_www, 'index.html');
                    var cspRemover = new CSPRemover(platformIndexLocal);
                    return cspRemover.Remove();
                }).then(function() {
                    anyPlatformSucceeded = true;
                });
            }, function(err) {
                events.emit('warn', err);
            });
        })
        .then(function() {
            // When doing livereload, at least one platform has to successfully launch, otherwise we just abort ...
            if (!anyPlatformSucceeded) {
                var msg = 'cordova-plugin-livereload: Livereload failed on all platforms, thus the "run" process is being aborted ... ';
                events.emit('warn', msg);
                return Q.reject(msg);
            }
            return Q();
        }, function(err) {
            events.emit('warn', err);
        });
};
