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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const version = require('../../package.json').version;
const cwd = process.cwd();
const src = _path2.default.join(cwd, 'webapp');
const dest = _path2.default.join(cwd, 'dist');

_commander2.default.command('clean').action(function () {
  (0, _clean2.default)(dest);
});

_commander2.default.command('build').action(function () {
  (0, _clean2.default)(dest).then(() => {
    (0, _build2.default)(src, dest, { watch: false });
  });
});

_commander2.default.command('serve').action(function () {
  (0, _serve2.default)(dest);
});

_commander2.default.command('start').action(function (args, next) {
  (0, _clean2.default)(dest).then(() => {
    (0, _build2.default)(src, dest, { watch: true });
    (0, _serve2.default)(dest);
  });
});

_commander2.default.command('deploy').action(function () {
  console.log('Deploy', arguments);
});

_commander2.default.version(version).parse(process.argv);