# ui5dev

Develop UI5 applications using ES6 syntax and in any code editor you want. You can start from scratch or export a project from SAP Web IDE.

![screenshot](https://bytebucket.org/zftrw-sap/ui5dev/raw/d70ee1c02e8749ec3c12f198c40b2d40db864718/screenshot.png?raw=true)


## Installation

Install `ui5dev` globally to be able to use it on every project.

```
$ npm install --global ui5dev
```


## Usage

Just `cd` to your app directory containing `webapp` folder and run one of the following commands: 

```
$ ui5dev start
```
- starts developemnt server and watches for changes. When you save a file it will be compiled and copied to `dist` directory. You can provide `-b` or `--open-browser` parameter to open system browser as well.

```
$ ui5dev build
```
- builds your app to `dist` directory which you can deploy to your SAP Netweaver Gateway. 

```
$ ui5dev clean
```
- removes `dist` folder. It is called at the beginning of `build` and `start` commands.

```
$ ui5dev open [path]
```
- opens system browser with the url to the development server. Make sure the server is running. The optional `path` argument is appended to the url if you need to navigate to anything other then `index.html`.

```
$ ui5dev deploy -t <transport> -u <user>
```
- deploys `dist` folder to the system provided in the config file. You need to provide valid tranport number and username as command arguments.

## App structure

Use the same app structere as SAP Web IDE does - just put your logic in `webapp` folder inside your app directory. Example folder structure could look like this:
```
YourUI5App
├── webapp
│   ├── Component.js
│   ├── index.html
│   └── view
│       ├── App.controller.js
│       └── App.view.xml
├── neo-app.json
└── ui5dev.config.json
```


## Configuration

No configuration file is needed to start webserver, but you can create `ui5dev.config.json` file for some customization.

`ui5dev.config.json`
```js
{
  "proxy": {
    "/resources": "https://sapui5.hana.ondemand.com/sdk",
    "/sap/opu/odata": "sap://DB0"
  },
  "deploy": {
    "system": "BD0",
    "package": "ZBD0TT001",
    "name": "ZUI5APP",
    "description": "My UI5 App"
  },
  "sourceFolder": "webapp",
  "targetFolder": "dist",
  "buildRequired": true,
  "port": 3100
}
```

`ui5dev` also reads configuration from `neo-app.json` and `.project.json` files which are created by SAP Web IDE. You can use all of them in one project.


## Proxying API Requests in Development

To integrate your app with an API Backend use `proxy` section in the config file. Proxies in `ui5dev` work very similar to destinations known from SAP Web IDE - they allow you to proxy some urls to a different server. They are really usesful if you need to test REST or OData services which are implemented in SAP Netweaver Geteway on a different machine. What is great here is that `ui5dev` can read access data to your SAP systems directly from SAP Logon. Just provide System ID of a system you want to proxy request to as an url with `sap://` protocol. For example `sap://BD0` will route to BD0 system.
 
`ui5dev.config.json`
```js
{
  "proxy": {
    "/resources": "https://sapui5.hana.ondemand.com/sdk",
    "/test-resources": "https://sapui5.hana.ondemand.com/sdk",
    "/sap/opu/odata": "sap://DB0"  // <-- this will route OData urls to DB0 system
  },
}
```
The above example will route to the latest version of the SAPUI5 library. If you need access specific version of the UI5 library, just replace `sdk` part with the required version number, e.g. `1.28.9`. 
But even better approach is to use the UI5 library directly from your SAP system like this:
```js
{
  "proxy": {
    "/resources": "sap://BD0/sap/public/bc/ui5_ui5/1",  // <-- this will route to UI5 library installed on BD0 system
    "*": "sap://BD0"  // <!-- all remaing routes should also go to BD0 system
  }
}
```
This will save you some headaches later;) And because this is very common scenario, there is a shorthand syntax provided to set up the same proxies as in the previous example:
```js
{
  "proxy": "sap://BD0"
}
```
You can even omit the protocol part `sap://` and just use `{ "proxy": "DB0" }`.

Proxies accept same parameters. The default one is `target`, but you may specify any property [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware#options) supports, like for example `pathRewrite`.
```js
{
  "proxy": {
    "/api": {
      "target": "https://externalapi.io/",
      "pathRewrite": {
        "^/api/old-path": "/api/new-path",  // rewrite path
        "^/api/remove/path": "/path"        // remove base path
      }
    }
  }
}
```
One special option is `useCorporateProxy` which is for those unhappy developers who are behind a proxy server.
```js
{
  "proxy": {
    "/resources": {
      "target": "https://sapui5.hana.ondemand.com/sdk",
      "useCorporateProxy": "http://my.proxy.com:8080"  // <!-- this makes life a bit less frustrating
    }
  }
}
```

`ui5dev` reads also `routes` section from `neo-app.json`. This is what you get from SAP Web IDE and will work out of the box in `ui5dev`:

`neo-app.json`
```js
{
  "routes": [
    {
      "path": "/sap/opu/odata",
      "target": {
        "type": "destination",
        "name": "BD0",  // SID of a system from SAP Logon
        "entryPath": "/sap/opu/odata"
      },
      "description": "BD0 Development System"
    },    
    {
      "path": "/resources",
      "target": {
        "type": "service",
        "libraryVersion": "1.32.18",  // add this for a specific SAPUI5 version
        "name": "sapui5",
        "entryPath": "/resources"
      },
      "description": "SAPUI5 Resources"
    }
  ]
}
```


## ES6 and Babel

You can write your JavaScript files using ES6 syntax. All files will be transpiled using Babel and put in `dist` directory. Babel is using `babel-preset-env` and targeting IE11 and above.

But please note that SAP Web IDE does not support Babel transpilation so if you want to be able to edit your code in SAP Web IDE as well, then just use plain ES5 syntax.


## Deployment

First create `deploy` section in `ui5dev.config.json` file, e.g.
```js
{
  "deploy": {
    "system": "BD0",
    "client": 110,  // optional
    "package": "ZBD0TT001",
    "name": "ZUI5APP",
    "description": "UI5 App"  // optional
  }
}
```
Then run
```
ui5dev deploy -t <transport> -u <user>
```
You need to provide valid transport number and username and you will be promoted for the user password.

If you deploy to `$TMP` package, then transport number is not required.

Alternatively you can go to transaction `SE38` and provide the program name as `/UI5/UI5_REPOSITORY_LOAD`. Just publish everything what is inside `dist` directory.  


## License

MIT