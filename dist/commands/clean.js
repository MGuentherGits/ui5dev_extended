'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function clean(dest) {
  const dirname = _path2.default.relative(process.cwd(), dest);
  if (dirname === '' || dirname.startsWith('.')) {
    _utils.logger.writeln(_utils.logger.color.red('Error. No target folder specified for the project.'));
    resolve();
    return;
  }

  if (_fs2.default.existsSync(dest)) {
    _utils.logger.writeln(`Cleaning ${_utils.logger.color.yellow(dirname)} directory`);
    rmDirSync(dest);
  }
};

function rmDirSync(dirpath, removeSelf = false) {
  const files = _fs2.default.readdirSync(dirpath);
  files.forEach(file => {
    const filepath = _path2.default.join(dirpath, file);
    if (_fs2.default.statSync(filepath).isFile()) {
      _fs2.default.unlinkSync(filepath);
    } else {
      rmDirSync(filepath, true);
    }
  });
  if (removeSelf) {
    _fs2.default.rmdirSync(dirpath);
  }
}

exports.default = clean;