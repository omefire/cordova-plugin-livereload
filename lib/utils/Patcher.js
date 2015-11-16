
/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */

var helpers = require('./helpers');
var multiPlatforms = require('./platforms');
var url = require('url');
var path = require('path');
var promiseUtils = require('./promise-util');
var ATSRemover = require('./ATSRemover');
var CSPRemover = require('./CSPRemover');
var multiPlatforms = require('./platforms');

function Patcher(projectRoot, platforms) {
    this.startPage = helpers.GetStartPage(projectRoot);
    this.projectRoot = projectRoot;
    this.platforms = platforms;
};

Patcher.prototype.patch = function (serverUrl) {
    var self = this;
    return promiseUtils.Q_chainmap(self.platforms, function (plat) {
        var platformIndexUrl = url.resolve(serverUrl, path.join(multiPlatforms.getPlatformWWWFolder(plat), self.startPage));
        helpers.ChangeStartPage(self.projectRoot, plat, platformIndexUrl);
        
        var platWWWFolder = multiPlatforms.getPlatformWWWFolder(plat);
        var platformIndexLocal = path.join(self.projectRoot, platWWWFolder, self.startPage);
        var cspRemover = new CSPRemover(platformIndexLocal);
        return cspRemover.Remove().then(function () {
            var atsRemover = new ATSRemover(self.projectRoot, plat);
            return atsRemover.Remove();
        });
    });
};

Patcher.prototype.removeCSP = function () {
    var self = this;
    var startPage = helpers.GetStartPage(self.projectRoot);

    var platformWwws = self.platforms.map(function (plat) {
        return path.join(self.projectRoot, multiPlatforms.getPlatformWWWFolder(plat));
    });

    return platformWwws.forEach(function (platWWWDir) {
        var platformIndexLocal = path.join(platWWWDir, startPage);
        var remover = new CSPRemover(platformIndexLocal);
        remover.Remove();
    });
};

module.exports = Patcher;
