'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function clean(dest) {
  return new Promise(function (resolve) {
    const dirname = _path2.default.relative(process.cwd(), dest);
    (0, _rimraf2.default)(dest, function () {
      (0, _utils.log)(`deleting directory ${_chalk2.default.red(dirname)}`);
      resolve();
    });
  });
};

exports.default = clean;