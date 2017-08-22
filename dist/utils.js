'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = undefined;
exports.validateSrc = validateSrc;
exports.readConfig = readConfig;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _saplogonRead = require('saplogon-read');

var _saplogonRead2 = _interopRequireDefault(_saplogonRead);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = exports.log = console.log;

function validateSrc(src, sourceFolder) {
  if (_fs2.default.existsSync(src)) {
    return true;
  }
  log(_chalk2.default.red(`Error: Missing \`${sourceFolder}\` folder. Are you in a correct directory?`));
  return false;
}

function readConfig() {
  const cfg = {
    sourceFolder: 'webapp',
    targetFolder: 'dist',
    port: generatePortNumber(),
    destinations: []
  };

  const cwd = process.cwd();
  let destinations = [];

  /* load config from .project.json */
  try {
    const configFile = _path2.default.join(cwd, 'neo-app.json');
    if (_fs2.default.existsSync(configFile)) {
      const config = require(configFile);
      if (config.build) {
        cfg.sourceFolder = config.build.sourceFolder || cfg.sourceFolder;
        cfg.targetFolder = config.build.targetFolder || cfg.targetFolder;
      }
    }
  } catch (ex) {
    log(_chalk2.default.red('Error parsing .project.json file.'));
  }

  /* load config from neo-app.json */
  try {
    const configFile = _path2.default.join(cwd, 'neo-app.json');
    if (_fs2.default.existsSync(configFile)) {
      const config = require(configFile);
      let routes = config.routes || [];
      routes = routes.filter(r => r.target.type === 'destination').map(route => {
        return {
          path: route.path,
          system: route.target.name
        };
      });
      destinations = destinations.concat(routes);
    }
  } catch (ex) {
    log(_chalk2.default.red('Error parsing neo-app.json file.'));
  }

  /* load config from config.json */
  try {
    const configFile = _path2.default.join(cwd, 'config.json');
    if (_fs2.default.existsSync(configFile)) {
      const config = require(configFile);
      const routes = config.routes || [];
      destinations = destinations.concat(routes);

      cfg.sourceFolder = config.sourceFolder || cfg.sourceFolder;
      cfg.targetFolder = config.targetFolder || cfg.targetFolder;
      cfg.port = config.port || cfg.port;
    }
  } catch (ex) {
    log(_chalk2.default.red('Error parsing config.json file.'));
  }

  destinations = destinations.map(function (route) {
    const logon = (0, _saplogonRead2.default)(route.system);
    if (!logon) {
      log(_chalk2.default.red(`Error: Unknown system ${_chalk2.default.cyan(route.system)} for ${_chalk2.default.yellow(route.path)}`));
      return null;
    }
    return {
      system: route.system,
      path: route.path,
      host: logon.host,
      https: false
    };
  });
  cfg.destinations = destinations.filter(destination => destination !== null);

  return cfg;
}

/**
 * Generates port number based on directory name.
 **/
function generatePortNumber() {
  const s = _path2.default.basename(process.cwd());
  if (s.length < 4) {
    return 3001;
  }
  const base = 2 * s.charCodeAt(1) + s.charCodeAt(2) + s.charCodeAt(s.length - 3) + s.charCodeAt(s.length - 1);
  return 3000 + base % 1000;
}