# cordova-plugin-livereload
This plugin's goal is to integrate LiveReload into Cordova workflow. It is based on BrowserSync.

What it does :

* Watch files in your www folder and automatically reload HTML and CSS in all connected devices

* Synchronize scrolls, clicks and form inputs on multiple devices.

## How to install it

    cordova plugin add https://github.com/omefire/cordova-plugin-livereload.git

## How to use it

* First install it : cordova plugin add https://github.com/omefire/cordova-plugin-livereload.git

* Grab this branch of the cordova-cli that introduces the --livereload flag : https://github.com/MSOpenTech/cordova-cli/tree/LiveReload

* Create your cordova project :

    ``` cordova create myProject ```

* Change your CSP to the following :

    ```<meta http-equiv="Content-Security-Policy" content="default-src *; style-src * 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *;">```

* Run your app :

    ```cordova run android --livereload```