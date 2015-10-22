# cordova-plugin-livereload
This plugin's goal is to integrate livereload and gestures synchronization across devices into the Cordova development workflow. It is based on BrowserSync.

What it does :

* Watch files in your www folder and automatically reload HTML and CSS in all connected devices

* Synchronize scrolls, clicks and form inputs on multiple devices.

## Supported platforms
* Android
* iOS

## How to use it

* Make sure your device/emulator and your computer are connected to the same wifi network


* Install the plugin on your machine : 

    ```cordova plugin add https://github.com/omefire/cordova-plugin-livereload.git```

* Create your cordova project :

    ``` cordova create myProject ```


* Run your app. This step launches the app on your device/emulator :

    ```cordova run android -- --livereload```

* Make changes to your HTML, CSS or Javascript and watch those changes instantaneously be reflected on your device/emulator

## Options

* Ignoring files

You can specify files to ignore with the --ignore=path option:
 This option accepts any [anymatch-compatible definition](https://www.npmjs.com/package/anymatch). It defines files/paths to be ignored :

```cordova run android -- --livereload --ignore=build/**/*.*```


## LICENSE

cordova-plugin-livereload is licensed under the MIT Open Source license.