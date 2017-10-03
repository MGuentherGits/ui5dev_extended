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

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function clean(dest) {
  return new Promise(function (resolve) {
    const dirname = _path2.default.relative(process.cwd(), dest);
    if (dirname === '' || dirname.startsWith('.')) {
      _utils.logger.writeln(_utils.logger.color.red('Error. No target folder specified for the project.'));
      resolve();
      return;
    }

    if (_fs2.default.existsSync(dest)) {
      (0, _rimraf2.default)(dest, function () {
        _utils.logger.writeln(`removing ${_utils.logger.color.red(dirname)} directory`);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

exports.default = clean;