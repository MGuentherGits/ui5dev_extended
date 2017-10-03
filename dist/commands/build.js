'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.walkSync = walkSync;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rollup = require('rollup');

var rollup = _interopRequireWildcard(_rollup);

var _rollupPluginBabel = require('rollup-plugin-babel');

var _rollupPluginBabel2 = _interopRequireDefault(_rollupPluginBabel);

var _outputFileSync = require('output-file-sync');

var _outputFileSync2 = _interopRequireDefault(_outputFileSync);

var _utils = require('../utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const babelrc = {
  presets: [[require.resolve('babel-preset-env'), {
    targets: {
      browsers: ['last 2 versions', 'ie >= 11']
    },
    modules: false
  }]],
  babelrc: false
};

function walkSync(dir, filelist) {
  const files = _fs2.default.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function (file) {
    const filename = _path2.default.join(dir, file);
    if (_fs2.default.statSync(filename).isDirectory()) {
      filelist = walkSync(filename, filelist);
    } else {
      filelist.push(filename);
    }
  });
  return filelist;
};

function canCompile(filename) {
  return ['.js'].includes(_path2.default.extname(filename));
}

function handleFile(src, dest, filename) {
  canCompile(filename) ? compileFile(src, dest, filename) : copyFile(src, dest, filename);
}

function compileFile(src, dest, filename) {
  rollup.rollup({
    entry: _path2.default.join(src, filename),
    plugins: [(0, _rollupPluginBabel2.default)(babelrc)]
  }).then(function (bundle) {
    _utils.logger.writeln(`compiling ${_utils.logger.color.green(filename)}`);
    bundle.write({
      format: 'cjs',
      dest: _path2.default.join(dest, filename)
    });
  });
}

function copyFile(src, dest, filename) {
  _utils.logger.writeln(`copying ${_utils.logger.color.cyan(filename)}`);

  (0, _outputFileSync2.default)(_path2.default.join(dest, filename), _fs2.default.readFileSync(_path2.default.join(src, filename)));
}

function build(src, dest, options = {}) {
  const filelist = walkSync(src).map(filename => _path2.default.relative(src, filename));

  filelist.forEach(filename => handleFile(src, dest, filename));

  if (options.watch) {
    const watcher = require('chokidar').watch(src, { recursive: true, ignoreInitial: true });
    ['add', 'change'].forEach(eventType => {
      watcher.on(eventType, filename => {
        setTimeout(function () {
          handleFile(src, dest, _path2.default.relative(src, filename));
        }, 100);
      });
    });
  }
}

exports.default = build;