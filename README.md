# cordova-plugin-livereload
This plugin's goal is to integrate LiveReload into Cordova workflow. It is based on BrowserSync.

What it does :

* Watch files in your www folder and automatically reload HTML and CSS in all connected devices

* Synchronize scrolls, clicks and form inputs on multiple devices.

## How to install it

    cordova plugin add https://github.com/omefire/cordova-plugin-livereload.git

## Supported platforms
* Android
* iOS

## How to use it

* Make sure your device/emulator and your computer are connected to the same wifi network


* Install the plugin on your computer : 

    ```cordova plugin add https://github.com/omefire/cordova-plugin-livereload.git```

* Create your cordova project :

    ``` cordova create myProject ```


* Run your app. This step launches the app on your device/emulator :

    ```cordova run android -- --livereload```

* Make changes to your HTML, CSS or Javascript and watch those changes instantaneously be reflected on your device/emulator