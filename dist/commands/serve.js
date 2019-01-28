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

var _httpProxyMiddleware = require('http-proxy-middleware');

var _httpProxyMiddleware2 = _interopRequireDefault(_httpProxyMiddleware);

var _httpsProxyAgent = require('https-proxy-agent');

var _httpsProxyAgent2 = _interopRequireDefault(_httpsProxyAgent);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function serve(dest, port, proxies) {
  const app = (0, _express2.default)();

  app.use((0, _morgan2.default)('short'));
  app.use(_express2.default.static(dest));

  Object.entries(proxies).forEach(([path, options]) => {
    if (options.useCorporateProxy) {
      options.agent = new _httpsProxyAgent2.default(options.useCorporateProxy);
    }
    options.onProxyRes = function (proxyResponse) {
      if (proxyResponse.headers['set-cookie']) {
        const cookies = proxyResponse.headers['set-cookie'].map(cookie => cookie.replace(/; secure/gi, ''));
        proxyResponse.headers['set-cookie'] = cookies;
      }
    };
    app.use(path, (0, _httpProxyMiddleware2.default)(options));
  });

  const server = app.listen(port, '0.0.0.0', function () {
    _utils.logger.writeln('Development server listening at:');
    (0, _utils.getAvailableIPAddresses)().forEach(ip => {
      _utils.logger.writeln('> ' + _utils.logger.color.yellow.underline(`http://${ip}:${port}/`));
    });

    const dir = _path2.default.relative(process.cwd(), dest);
    if (dir === '') {
      _utils.logger.writeln('and serving contend from current directory.');
    } else {
      _utils.logger.writeln(`and serving content from ${_utils.logger.color.yellow(dir)} directory.`);
    }

    if (Object.keys(proxies).length > 0) {
      _utils.logger.writeln('Loaded proxies:');
      Object.entries(proxies).forEach(([path, { target, system, useCorporateProxy }]) => {
        let logMsg = `> ${_utils.logger.color.yellow(path)} => ${_utils.logger.color.cyan(target)}`;
        if (path !== '*') {
          logMsg += _utils.logger.color.yellow(path);
        }
        if (system) {
          logMsg += ` (${system})`;
        }
        if (useCorporateProxy) {
          logMsg += ` (corporate proxy: ${useCorporateProxy})`;
        }
        _utils.logger.writeln(logMsg);
      });
    } else {
      _utils.logger.writeln(`No proxy loaded.`);
    }
  });
}

exports.default = serve;