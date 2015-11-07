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

    ```cordova plugin add cordova-plugin-livereload```

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

* Local tunnel

In case you're facing connection issues due to proxy/firewall, you can use the --tunnel option:

```cordova run android -- --livereload --tunnel```

 This option allows you to easily access the livereload server on your local development machine without messing with DNS and firewall settings.
 It relies on [Localtunnel](http://localtunnel.me/), which will assign you a unique publicly accessible url that will proxy all requests to your locally running development server.

* ghostMode (Syncing across devices)

By default, gestures(clicks, scrolls & form inputs) on any device will be mirrored to all others.
This option allows you to disable it if you want:

```cordova run android ios -- --livereload --ghostMode=false```


## LICENSE

cordova-plugin-livereload is licensed under the MIT Open Source license.