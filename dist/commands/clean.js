'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function clean(dest) {
  return new Promise(function (resolve) {
    const dirname = _path2.default.relative(process.cwd(), dest);
    if (dirname === '' || dirname.startsWith('.')) {
      (0, _utils.log)(_chalk2.default.red('Error. No target folder specified for the project.'));
      resolve();
      return;
    }

    if (_fs2.default.existsSync(dest)) {
      (0, _rimraf2.default)(dest, function () {
        (0, _utils.log)(`removing ${_chalk2.default.red(dirname)} directory`);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

exports.default = clean;