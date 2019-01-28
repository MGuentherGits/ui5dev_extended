#! /usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _clean = require('../commands/clean');

var _clean2 = _interopRequireDefault(_clean);

var _build = require('../commands/build');

var _build2 = _interopRequireDefault(_build);

var _serve = require('../commands/serve');

var _serve2 = _interopRequireDefault(_serve);

var _open = require('../commands/open');

var _open2 = _interopRequireDefault(_open);

var _deploy = require('../commands/deploy');

var _deploy2 = _interopRequireDefault(_deploy);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const config = (0, _utils.readConfig)();
const version = require('../../package.json').version;

_prompt2.default.message = '';
_prompt2.default.delimiter = ':';
_prompt2.default.colors = false;

function serveContent(options) {
  (0, _serve2.default)(config.dest, config.port, config.proxy);
  if (options.openBrowser) {
    (0, _open2.default)(options.openBrowser, config.port);
  }
}

_commander2.default.command('clean').action(function () {
  if ((0, _utils.validateBuild)(config)) {
    (0, _clean2.default)(config.dest);
  }
});

_commander2.default.command('build').action(function () {
  if ((0, _utils.validateBuild)(config)) {
    (0, _clean2.default)(config.dest);
    (0, _build2.default)(config.src, config.dest, { watch: false });
  }
});

_commander2.default.command('serve').option('-b, --open-browser [path]', 'Open browser').action(function (options) {
  serveContent(options);
});

_commander2.default.command('start').option('-b, --open-browser [path]', 'Open browser').action(function (options) {
  if (config.buildRequired) {
    if ((0, _utils.validateBuild)(config)) {
      (0, _clean2.default)(config.dest);
      serveContent(options);
      (0, _build2.default)(config.src, config.dest, { watch: true });
    }
  } else {
    serveContent(options);
  }
});

_commander2.default.command('open [path]').action(function (path) {
  (0, _open2.default)(path, config.port);
});

_commander2.default.command('deploy').option('-t, --transport <transport>', 'Use transport').option('-u, --user <user>', 'Auth user').action(function ({ transport, user }) {
  const options = Object.assign({}, config.deploy, { transport, user });

  if ((0, _utils.validateDeploy)(options, config.dest)) {
    _prompt2.default.start();
    _prompt2.default.get([{
      name: 'password',
      description: 'Enter your password',
      hidden: true,
      replace: '*'
    }], function (err, { password }) {
      options.password = password;
      (0, _deploy2.default)(config.dest, options);
    });
  };
});

_commander2.default.version(version).parse(process.argv);

if (!process.argv.slice(2).length) {
  _commander2.default.outputHelp();
}