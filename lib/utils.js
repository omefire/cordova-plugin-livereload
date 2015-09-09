/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/
var Q = require('q'),
    events = require('./events'),
    path = require('path'),
    fs = require('fs'),
    promiseUtils = require('./promise-util');


 // ToDO: this is fragile becoz if this file changes location, we're screwed => Write a test for this !
var installLocation = path.join(__dirname, '../../');

var deps = ['ua-parser-js@0.7.7', 'proxy-middleware@0.13.1', 'browser-sync@2.7.13'];
module.exports.dependencies = deps;

module.exports.installDependencies = function () {

    var packages = deps;
    var deferred = Q.defer();
    var npm = require('npm');

    var endOfLine = require('os').EOL;
    var pkgStr = packages.reduce(function(str, pkg) {
        str += endOfLine;
        str += pkg;
    }, '');
    events.emit('warn', 'Installing LiveReload dependencies : ' + pkgStr);

    npm.load({
        loaded: false
    }, function(err) {
        if (err) {
	    //return Q.reject('npm load failed.');
            throw new Error("npm load failed."); // Test // ToDO: return Q promise ?
        }
        npm.commands.install(installLocation, packages, function(er, data) {
            // log the error or data
            if (err) { // Test // ToDO: return Q promise
                throw new Error("dependencies install failed."); // Tesst // ToDO: return Q promise -> deferred.fail();
		//return Q.reject('dependencies install failed.');
            }
            deferred.resolve();
        });
    });

    return deferred.promise;
};

// Checks if the deps are installed
module.exports.areDepsInstalled = function() {
    return deps.reduce(function(soFar, dep) {
	var depFolder = dep.split('@')[0];
	return soFar.then(function(doesPrevDepExist){
	    var doesCurrentDepExist = fs.existsSync(path.join(installLocation, 'node_modules', depFolder));
	    return Q(doesPrevDepExist && doesCurrentDepExist);
	});
    }, Q(true));
};