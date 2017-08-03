# ui5dev

Develop UI5 applications using ES6 syntax and in any code editor you want. You can start from scratch or export a project from SAP WebIde.

![alt tag](screenshot.png?raw=true)


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
- starts developemnt server and watches for changes. When you save a file it will be compiled and copied to `dist` directory.

```
$ ui5dev build
```
- builds your app to `dist` directory which you can deploy to your SAP Netweaver Gateway. 

```
$ ui5dev clean
```
- removes `dist` folder. It is called on the beginning of `build` and `start` commands.


## App structure

Use the same app structere as SAP WebIde does - just put your logic in `webapp` folder inside your app directory. Example folder structure could look like this:
```
YourUI5App
├── webapp
│   ├── Component.json
│   ├── index.html
│   └── view
│       ├── App.controller.json
│       └── App.view.html
├── neo-app.json
└── config.json
 ```


## Configuration

No configuration file is needed to start webserver, but if you need proxy (destinations) you can use `neo-app.json` configration from SAP WebIde or provide `config.js` file which is a bit simpler to write. You can use both in one project. Only the routing part is already used.

`neo-app.json`
```json
{
  "routes": [
    {
      "path": "/sap/opu/odata",
      "target": {
        "type": "destination",
        "name": "BD0",
        "entryPath": "/sap/opu/odata"
      },
      "description": "BD0 Development System"
    }    
  ]
}
```

`config.json`
```json
{
  "routes": [
    {
      "path": "/sap/opu/odata",
      "system": "BD0"
    }    
  ]
}
```

`ui5dev` reads system information directly from SAP Logon configuration file using `saplogon-read` module which is also available in NPM Module Registry.


## ES6 and Babel

You can write your JavaScript files using ES6 syntax. All files will be transpiled using Babel and put in `dist` directory. Babel is using `babel-preset-env` and targeting IE11 and above.

But please note that SAP WebIde does not support Babel transpilation so if you also want to be able to edit your code in SAP WebIde just use plain ES5 syntax.


## Deployment

Currently there is no command for app deployment to SAP Netweaver Gateway. But you can go to transaction SE38 and provide the program name as `/UI5/UI5_REPOSITORY_LOAD`. Just publish everything what is inside `dist` directory.  


## License

MIT