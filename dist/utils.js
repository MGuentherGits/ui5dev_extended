'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = undefined;
exports.generatePortNumber = generatePortNumber;
exports.getHostName = getHostName;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = exports.log = console.log;

function generatePortNumber() {
  const s = _path2.default.basename(process.cwd());
  if (s.length < 4) {
    return 3001;
  }
  const base = 2 * s.charCodeAt(1) + s.charCodeAt(2) + s.charCodeAt(s.length - 3) + s.charCodeAt(s.length - 1);
  return 3000 + base % 1000;
}

function getHostName(port) {
  return `http://127.0.0.1:${port}/`;
}