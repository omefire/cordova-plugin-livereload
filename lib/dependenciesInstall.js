module.exports = function(context) {
    var Q = context.requireCordovaModule('q');
    var npm = context.requireCordovaModule('npm');
    var fs = require('fs');
    var path = require('path');

    // package.json file is a sister folder to 'lib' folder, in which we currently are executing this script from
    var packageJSONDir = path.join(__dirname, '../'); 
    var packageJSONLocation = path.join(packageJSONDir, 'package.json');
    var dependencies = JSON.parse(fs.readFileSync(packageJSONLocation, 'utf-8')).dependencies;
    
    var depNames = [];
    for(var dep in dependencies) {
    	if (dependencies.hasOwnProperty(dep)) {
            depNames.push(dep);
    	}
    }

    var packagesToInstall = depNames.map(function(dep){
    	return dep + '@' + dependencies[dep];
    });

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
