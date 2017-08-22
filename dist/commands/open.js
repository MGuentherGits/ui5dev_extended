'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opn = require('opn');

var _opn2 = _interopRequireDefault(_opn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function open(path, port) {
  let url = `http://127.0.0.1:${port}/`;
  if (typeof path === 'string') {
    url += path;
  }
  (0, _opn2.default)(url);
}

exports.default = open;