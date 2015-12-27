
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
var ncp = require('ncp').ncp;
var Q = require('q');

var fs = require('fs');

function Patcher(projectRoot, platforms) {
    this.startPage = helpers.GetStartPage(projectRoot);
    this.projectRoot = projectRoot;
    this.platforms = platforms;
};

/**
 * Patching - This is the process of removing anything that can prevent the mobile app from connecting to the BrowserSync server.
 * This function currently does the following for each platform:
 *    - Removes CSP (Content-Security-Policy) restrictions
 *    - Removes ATS (App Transport Security) in the case of iOS9+
 *    - Copies the homePage to the mobile app
 *    - Changes the start page of the app to the homePage
 * 
 * HomePage Role:
 *    - The homePage allows us to ping the BrowserSync server 
 *    - If we can't connect to any of the BrowserSync servers, we display a meaningful error message to the user
 *    - If we can successfully connect to one of the BrowserSync servers, we proceed with loading the app
 */
Patcher.prototype.patch = function (serverUrls) {
    var self = this;
    return promiseUtils.Q_chainmap(self.platforms, function (plat) {
        var platWWWFolder = multiPlatforms.getPlatformWWWFolder(plat);
        var platformIndexLocal = path.join(self.projectRoot, platWWWFolder, self.startPage);
        var cspRemover = new CSPRemover(platformIndexLocal);
        return cspRemover.Remove().then(function () {
            var atsRemover = new ATSRemover(self.projectRoot, plat);
            return atsRemover.Remove();
        }).then(function () {
            var platformIndexUrls = {};
            for(var sUrl in serverUrls) {
                if(serverUrls.hasOwnProperty(sUrl)) {
                    platformIndexUrls[sUrl] = url.resolve(serverUrls[sUrl], path.join(multiPlatforms.getPlatformWWWFolder(plat), self.startPage));
                }
            }
            return copyHomePage(self.projectRoot, plat, platformIndexUrls);
        }).then(function (homePage) {
            return helpers.ChangeStartPage(self.projectRoot, plat, homePage); 
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

// Copy the homePage.html that comes with livereload into the platform's folder
// Also, copy the q.js file that's required by homePage.html
function copyHomePage(projectRoot, platform, platformIndexUrls) {

    // 1- copy the 'homePage' directory
    var pluginHomePageDir = path.join(__dirname, 'homePage');
    
    // Append random string to 'homePage' directory name 
    // ... so that it doesn't clash with potential user-defined homePage.html files 
    var homePageDir = 'homePage_' + Math.random();
    var homePageDirFullPath = path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(platform), homePageDir);
    return Q.nfcall(ncp, pluginHomePageDir, homePageDirFullPath).then(function() {
        
        // 2- replace '__SERVER_URLs__' by the appropriate string
        var src = path.join(homePageDirFullPath, 'homePage.html');
        
        var srcContent = fs.readFileSync(src, 'utf-8');
        srcContent = srcContent.replace(/__SERVER_URLs__/g, JSON.stringify(platformIndexUrls));
        
        fs.writeFileSync(src, srcContent, {flags: 'w'}); 
        
        return path.join(homePageDir, 'homePage.html'); //HOME_PAGE + randomizedString;
    }).fail(function(err) {
        // ToDO: Test this
        return Q.reject(err);
    });
   
    

    
    
    /*var HOME_PAGE = 'homePage.html'; 
    
    var src = path.join(__dirname, HOME_PAGE);
    
    var dest = path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(platform), HOME_PAGE);
    
    // Append random string to the homePage.html filename being copied into the platforms folder 
    // ... so that it doesn't clash with potential user-defined homePage.html files
    var randomizedString = '_' + Math.random() + '.html';
    dest += randomizedString;
    
    // Copy 'homePage.html' from src to dest
    var srcContent = fs.readFileSync(src, 'utf-8');
    fs.writeFileSync(dest, srcContent.replace(/__SERVER_URLs__/g, JSON.stringify(platformIndexUrls))); 
    
    // Copy q.js file
    var qFileSrc = path.join(__dirname, 'q-1-0-1.js');
    var qFileDest = path.join(projectRoot, multiPlatforms.getPlatformWWWFolder(platform), 'q-1-0-1.js');
    fs.writeFileSync(qFileDest, qFileSrc);
    
    return HOME_PAGE + randomizedString;*/
}

module.exports = Patcher;
