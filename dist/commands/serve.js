'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _expressHttpProxy = require('express-http-proxy');

var _expressHttpProxy2 = _interopRequireDefault(_expressHttpProxy);

var _saplogonRead = require('saplogon-read');

var _saplogonRead2 = _interopRequireDefault(_saplogonRead);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getDestinations(dest) {
  const cwd = _path2.default.dirname(dest);
  let destinations = [];

  /* load config from neo-app.json */
  try {
    const configFile = _path2.default.join(cwd, 'neo-app.json');
    if (_fs2.default.existsSync(configFile)) {
      let routes = require(configFile).routes;
      routes = routes.filter(r => r.target.type === 'destination').map(route => {
        return {
          path: route.path,
          system: route.target.name
        };
      });
      destinations = destinations.concat(routes);
    }
  } catch (ex) {
    (0, _utils.log)(`${_chalk2.default.red('Error parsing neo-app.json file.')}`);
  }

  /* load config from config.json */
  try {
    const configFile = _path2.default.join(cwd, 'config.json');
    if (_fs2.default.existsSync(configFile)) {
      let routes = require(configFile).routes;
      destinations = destinations.concat(routes);
    }
  } catch (ex) {
    (0, _utils.log)(`${_chalk2.default.red('Error parsing config.json file.')}`);
  }

  destinations = destinations.map(function (route) {
    const logon = (0, _saplogonRead2.default)(route.system);
    if (!logon) {
      (0, _utils.log)(`${_chalk2.default.red('Error')}: Unknown system ${_chalk2.default.cyan(route.system)} for ${_chalk2.default.yellow(route.path)}`);
      return null;
    }
    return {
      system: route.system,
      path: route.path,
      host: logon.host,
      https: false
    };
  });
  return destinations.filter(destination => destination !== null);
}

function serve(dest) {
  const app = (0, _express2.default)();
  const destinations = getDestinations(dest);
  const port = (0, _utils.generatePortNumber)();

  app.use((0, _morgan2.default)('short'));
  app.use(_express2.default.static(dest));

  destinations.forEach(function (destination) {
    app.use(destination.path, (0, _expressHttpProxy2.default)(destination.host, {
      proxyReqPathResolver: req => destination.path + _url2.default.parse(req.url).path,
      https: destination.https
    }));
  });

  const server = app.listen(port, '0.0.0.0', function () {
    const host = (0, _utils.getHostName)(port);

    (0, _utils.log)(`Development server listening on ${_chalk2.default.yellow.underline(host)}`);
    if (destinations.length > 0) {
      destinations.forEach(destination => {
        (0, _utils.log)(`destination: ${_chalk2.default.yellow(destination.path)} => ${_chalk2.default.cyan(destination.host)} (${destination.system})`);
      });
    } else {
      (0, _utils.log)(`No external destinations loaded.`);
    }
  });
}

exports.default = serve;