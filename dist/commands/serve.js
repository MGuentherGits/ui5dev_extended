'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _expressHttpProxy = require('express-http-proxy');

var _expressHttpProxy2 = _interopRequireDefault(_expressHttpProxy);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function serve(dest, port, destinations) {
  const app = (0, _express2.default)();

  app.use((0, _morgan2.default)('short'));
  app.use(_express2.default.static(dest));

  destinations.forEach(function (destination) {
    const { host, hostSufix } = (0, _utils.splitHost)(destination.targetHost);
    app.use(destination.path, (0, _expressHttpProxy2.default)(host, {
      proxyReqPathResolver: req => hostSufix + destination.path + _url2.default.parse(req.url).path,
      https: destination.https
    }));
  });

  const server = app.listen(port, '0.0.0.0', function () {
    (0, _utils.log)('Development server listening on:');
    (0, _utils.getAvailableIPAddresses)().forEach(ip => {
      (0, _utils.log)('> ' + _chalk2.default.yellow.underline(`http://${ip}:${port}/`));
    });

    const dir = _path2.default.relative(process.cwd(), dest);
    if (dir === '') {
      (0, _utils.log)('and serving contend from current directory.');
    } else {
      (0, _utils.log)(`and serving content from ${_chalk2.default.yellow(dir)} directory.`);
    }

    if (destinations.length > 0) {
      (0, _utils.log)('Loaded destinations:');
      destinations.forEach(destination => {
        const protocol = destination.https ? 'https://' : 'http://';
        let logMsg = `> ${_chalk2.default.yellow(destination.path)} => ${_chalk2.default.yellow(protocol)}${_chalk2.default.cyan(destination.targetHost)}${_chalk2.default.yellow(destination.path)}`;
        if (destination.targetSystem) {
          logMsg += ` (${destination.targetSystem})`;
        }
        (0, _utils.log)(logMsg);
      });
    } else {
      (0, _utils.log)(`No external destinations loaded.`);
    }
  });
}

exports.default = serve;