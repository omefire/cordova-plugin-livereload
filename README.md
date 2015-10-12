# cordova-plugin-livereload
This plugin's goal is to integrate LiveReload into Cordova workflow. It is based on BrowserSync.

What it does :

* Watch files in your www folder and automatically reload HTML and CSS in all connected devices

* Synchronize scrolls, clicks and form inputs on multiple devices.

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

## Options

* Ignoring files
You can also specify files to ignore with the --ignore=path option:
 (anymatch-compatible definition) Defines files/paths to be ignored. The whole relative or absolute path is tested, not just filename. If a function with two arguments is provided, it gets called twice per path - once with a single argument (the path), second time with two arguments (the path and the fs.Stats object of that path) :

      ```cordova run android -- --livereload --ignore=build/**/*.*```


## LICENSE

cordova-plugin-livereload is licensed under the MIT Open Source license.