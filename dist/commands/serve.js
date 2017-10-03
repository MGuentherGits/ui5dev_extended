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
    _utils.logger.writeln('Development server listening on:');
    (0, _utils.getAvailableIPAddresses)().forEach(ip => {
      _utils.logger.writeln('> ' + _utils.logger.color.yellow.underline(`http://${ip}:${port}/`));
    });

    const dir = _path2.default.relative(process.cwd(), dest);
    if (dir === '') {
      _utils.logger.writeln('and serving contend from current directory.');
    } else {
      _utils.logger.writeln(`and serving content from ${_utils.logger.color.yellow(dir)} directory.`);
    }

    if (destinations.length > 0) {
      _utils.logger.writeln('Loaded destinations:');
      destinations.forEach(destination => {
        const protocol = destination.https ? 'https://' : 'http://';
        let logMsg = `> ${_utils.logger.color.yellow(destination.path)} => ${_utils.logger.color.yellow(protocol)}${_utils.logger.color.cyan(destination.targetHost)}${_utils.logger.color.yellow(destination.path)}`;
        if (destination.targetSystem) {
          logMsg += ` (${destination.targetSystem})`;
        }
        _utils.logger.writeln(logMsg);
      });
    } else {
      _utils.logger.writeln(`No external destinations loaded.`);
    }
  });
}

exports.default = serve;