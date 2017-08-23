'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = undefined;
exports.validateBuild = validateBuild;
exports.getAvailableIPAddresses = getAvailableIPAddresses;
exports.readConfig = readConfig;
exports.isSameDirectory = isSameDirectory;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _saplogonRead = require('saplogon-read');

var _saplogonRead2 = _interopRequireDefault(_saplogonRead);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = exports.log = console.log;

function validateBuild(config) {
  if (!config.buildRequired) {
    log(_chalk2.default.red('Command not valid - no active build configration for this project.'));
    return false;
  }

  if (!_fs2.default.existsSync(config.src)) {
    log(_chalk2.default.red(`Error: Missing \`${config.sourceFolder}\` folder.`));
    return false;
  }

  return true;
}

function getAvailableIPAddresses() {
  const ifaces = _os2.default.networkInterfaces();
  return Object.values(ifaces).reduce(function (arr, entry) {
    return arr.concat(entry);
  }, []).filter(entry => entry.family === 'IPv4').map(entry => entry.address);
}

function readConfig() {
  const cfg = {
    sourceFolder: '',
    targetFolder: '',
    buildRequired: null,
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
        if (config.build.buildRequired !== undefined) {
          cfg.buildRequired = config.build.buildRequired;
        }
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
          targetSystem: route.target.name
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
      const routes = config.destinations || [];
      destinations = destinations.concat(routes);

      cfg.sourceFolder = config.sourceFolder || cfg.sourceFolder;
      cfg.targetFolder = config.targetFolder || cfg.targetFolder;
      cfg.port = config.port || cfg.port;
      if (config.buildRequired !== undefined) {
        cfg.buildRequired = config.buildRequired;
      }
    }
  } catch (ex) {
    log(_chalk2.default.red('Error parsing config.json file.'));
  }

  destinations = destinations.map(function (route) {
    const logon = (0, _saplogonRead2.default)(route.targetSystem);
    if (!logon) {
      log(_chalk2.default.red(`Error: Unknown system ${_chalk2.default.cyan(route.targetSystem || '')} for ${_chalk2.default.yellow(route.path)}`));
      return null;
    }
    return {
      targetSystem: route.targetSystem,
      path: route.path,
      host: logon.host,
      https: false
    };
  });
  cfg.destinations = destinations.filter(destination => destination !== null);

  // check if we can use webapp folder
  if (cfg.sourceFolder === '') {
    const webappFolder = _path2.default.join(cwd, 'webapp');
    if (_fs2.default.existsSync(webappFolder)) {
      cfg.sourceFolder = 'webapp';
      cfg.targetFolder = 'dist';
    }
  }

  if (cfg.buildRequired === null) {
    cfg.buildRequired = cfg.sourceFolder !== '';
  } else {
    if (cfg.sourceFolder === '') {
      cfg.buildRequired = false;
      log(`Build disabled because no source folder defined.`);
    }
  }
  if (!cfg.buildRequired) {
    cfg.targetFolder = cfg.sourceFolder;
  }

  cfg.src = _path2.default.join(cwd, cfg.sourceFolder);
  cfg.dest = _path2.default.join(cwd, cfg.targetFolder);

  return cfg;
}

function isSameDirectory(dir1, dir2) {
  return _path2.default.relative(dir1, dir2) === '';
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