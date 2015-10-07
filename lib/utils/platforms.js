/**
﻿ *******************************************************
﻿ *                                                     *
﻿ *   Copyright (C) Microsoft. All rights reserved.     *
﻿ *                                                     *
﻿ *******************************************************
﻿ */

var WWW_FOLDER = {
    android: 'platforms/android/assets/www',
    ios: 'platforms/ios/www'
};

var CONFIG_LOCATION = {
    android: 'platforms/android/res/xml',
    ios: 'platforms/ios/HelloCordova'
};


module.exports.isPlatformSupported = function(platform) {
    return WWW_FOLDER.hasOwnProperty(platform) && CONFIG_LOCATION.hasOwnProperty(platform);
};

module.exports.getPlatformWWWFolder = function(platform) {
    return WWW_FOLDER[platform];
};

module.exports.getConfigFolder = function(platform) {
    return CONFIG_LOCATION[platform];
};
