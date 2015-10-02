var fs = require('fs');
var path = require('path');

// This function gets called after every plugin addition, as specified in plugin.xml
module.exports = function(context) {

    var options = context.opts;
    var Q = context.requireCordovaModule('q');

    // package.json file is a sister folder to 'lib' folder, in which we currently are executing this script from
    var packageJSONDir = path.join(__dirname, '../');
    var packageJSONLocation = path.join(packageJSONDir, 'package.json');
    var packageJSON = JSON.parse(fs.readFileSync(packageJSONLocation, 'utf-8'));

    var pluginName = packageJSON.name;


    // This function checks if the pluginSpec provided refers to 'cordova-plugin-liverelad'
    var isLiveReloadPlugin = function(pluginSpec) {

        // A plugin can be installed via an npm package, a path or a git url. 
        //     e.g: https://github.com/omefire/cordova-plugin-livereload.git
        //          https://github.com/schacon/simplegit 
        //          cordova-plugin-livereload
        //          ../cordova-plugin-livereload/
        //          ../plugin/
        //          C:\Plugins\cordova-plugin-livereload\
        //          C:\Plugins\plugin\
        // Instead of testing for all those possibilities,
        // ... let's test instead for whether the livereload name is contained in the npm package name, the local folder path or the git url
        return pluginSpec.indexOf(pluginName) != -1;
    };

    // Only install livereload dependencies if 'cordova-plugin-livereload' is among the plugins we've just installed
    // ... Otherwise, livereload dependencies get installed after every plugin install
    if (options.plugins.filter(isLiveReloadPlugin).length === 0) {
        return Q();
    }

    var dependencies = packageJSON.dependencies;

    var depNames = [];
    for (var dep in dependencies) {
        if (dependencies.hasOwnProperty(dep)) {
            depNames.push(dep);
        }
    }

    var packagesToInstall = depNames.map(function(dep) {
        return dep + '@' + dependencies[dep];
    });

    var npm = context.requireCordovaModule('npm');
    return Q.promise(function(resolve, reject, notify) {
        npm.load({
            loaded: false
        }, function(err) {
            if (err) {
                console.log('cordova-plugin-livereload: An error occurred while loading npm');
                reject('cordova-plugin-livereload: npm load failed.');
                return;
            }
            npm.commands.install(packageJSONDir, packagesToInstall, function(er, data) {
                // log the error or data
                if (err) {
                    console.log('cordova-plugin-livereload: dependencies install failed.');
                    reject('cordova-plugin-livereload: dependencies install failed.');
                    return;
                }
                resolve();
            });
        });
    });
};
