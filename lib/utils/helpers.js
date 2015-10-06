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

// Checks whether a command is compatible with livereload
// Currently, Only the following commands are compatible with LiveReload :
//     - `cordova run android -- --livereload` 
//     - `cordova run android --livereload`
//     - `cordova emulate android -- --livereload`
//     - `cordova emulate android --livereload`
module.exports.IsCmdLiveReloadCompatible = function(context) {

    // Allow livereload to be started by running: `cordova run android --livereload` or by running `cordova run android -- --livereload`
    if (!context.opts.livereload && (context.opts.options.indexOf('--livereload') === -1)) {
        return false;
    }

    // Has the user issued a livereload compatible command ? e.g: run or emulate
    var cordovaRunRegex = /(.*)(cordova)(\s+)(run|emulate)(.*)/i;
    var isCordovaRunCmd = cordovaRunRegex.test(context.cmdLine);

    return isCordovaRunCmd ? true : false;
};
