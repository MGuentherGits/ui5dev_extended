'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
    app.use(destination.path, (0, _expressHttpProxy2.default)(destination.host, {
      proxyReqPathResolver: req => destination.path + _url2.default.parse(req.url).path,
      https: destination.https
    }));
  });

  const server = app.listen(port, '0.0.0.0', function () {
    const host = `http://127.0.0.1:${port}/`;
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