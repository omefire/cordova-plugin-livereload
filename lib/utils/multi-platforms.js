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


module.exports.isPlatformSupported = function (platform) {
    return WWW_FOLDER.hasOwnProperty(platform) && CONFIG_LOCATION.hasOwnProperty(platform);
};

module.exports.getPlatformWWWFolder = function(platform) {
    return WWW_FOLDER[platform]; // what if there's no entry for the specified platform ?
};

module.exports.getConfigFolder = function(platform) {
    return CONFIG_LOCATION[platform]; // what if there's no entry for the specified platform ?
};
