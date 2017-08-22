'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opn = require('opn');

var _opn2 = _interopRequireDefault(_opn);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function open(path) {
  let url = (0, _utils.getHostName)((0, _utils.generatePortNumber)());
  if (typeof path === 'string') {
    url += path;
  }
  (0, _opn2.default)(url);
}

exports.default = open;