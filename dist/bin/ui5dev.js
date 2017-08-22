#! /usr/bin/env node
'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _clean = require('../commands/clean');

var _clean2 = _interopRequireDefault(_clean);

var _build = require('../commands/build');

var _build2 = _interopRequireDefault(_build);

var _serve = require('../commands/serve');

var _serve2 = _interopRequireDefault(_serve);

var _open = require('../commands/open');

var _open2 = _interopRequireDefault(_open);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const config = (0, _utils.readConfig)();
const version = require('../../package.json').version;
const cwd = process.cwd();
const src = _path2.default.join(cwd, config.sourceFolder);
const dest = _path2.default.join(cwd, config.targetFolder);

_commander2.default.command('clean').action(function () {
  (0, _clean2.default)(dest);
});

_commander2.default.command('build').action(function () {
  if ((0, _utils.validateSrc)(src, config.sourceFolder)) {
    (0, _clean2.default)(dest).then(() => {
      (0, _build2.default)(src, dest, { watch: false });
    });
  }
});

_commander2.default.command('serve').option('-b, --open-browser [path]', 'Open browser').action(function (options) {
  (0, _serve2.default)(dest, config.port, config.destinations);
  if (options.openBrowser) {
    (0, _open2.default)(options.openBrowser, config.port);
  }
});

_commander2.default.command('start').option('-b, --open-browser [path]', 'Open browser').action(function (options) {
  if ((0, _utils.validateSrc)(src, config.sourceFolder)) {
    (0, _clean2.default)(dest).then(() => {
      (0, _build2.default)(src, dest, { watch: true });
      (0, _serve2.default)(dest, config.port, config.destinations);
      if (options.openBrowser) {
        (0, _open2.default)(options.openBrowser, config.port);
      }
    });
  }
});

_commander2.default.command('open [path]').action(function (path) {
  (0, _open2.default)(path, config.port);
});

_commander2.default.command('deploy').action(function () {
  (0, _utils.log)('Deployment is not implemented yet! :(');
});

_commander2.default.version(version).parse(process.argv);

if (!process.argv.slice(2).length) {
  _commander2.default.outputHelp();
}