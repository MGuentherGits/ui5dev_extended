'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logger = undefined;
exports.validateBuild = validateBuild;
exports.validateDeploy = validateDeploy;
exports.getAvailableIPAddresses = getAvailableIPAddresses;
exports.splitHost = splitHost;
exports.readConfig = readConfig;
exports.isSameDirectory = isSameDirectory;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _saplogonRead = require('saplogon-read');

var _saplogonRead2 = _interopRequireDefault(_saplogonRead);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = exports.logger = {
  write(...args) {
    const string = _util2.default.format.apply(null, args);
    process.stdout.write(string);
  },

  writeln(...args) {
    const string = _util2.default.format.apply(null, args) + '\n';
    process.stdout.write(string);
  },

  color: _chalk2.default,
  format: _util2.default.format
};

function validateBuild(config) {
  if (!config.buildRequired) {
    logger.writeln('Command not valid - no active build configration for this project.');
    return false;
  }

  if (!_fs2.default.existsSync(config.src)) {
    logger.writeln(logger.color.red(`Error: Missing \`${config.sourceFolder}\` folder.`));
    return false;
  }

  return true;
}

function validateDeploy(config, dist) {
  if (!_fs2.default.existsSync(dist)) {
    logger.writeln(`${logger.color.cyan(dist)} directory does not exist.`);
    return false;
  }
  if (!config.user) {
    logger.writeln('Use -u <user> to provide username.');
    return false;
  }
  if (!config.name) {
    logger.writeln('No app name (BSP container) defined. Please review your config file.');
    return false;
  }
  if (!config.package) {
    logger.writeln('No deployment package defined. Please review your config file.');
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

function splitHost(host) {
  let hostSufix = '';
  const slashPos = host.indexOf('/');
  if (slashPos > 0) {
    hostSufix = host.substr(slashPos);
    host = host.substr(0, slashPos);
  }
  return { host, hostSufix };
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
    const configFile = _path2.default.join(cwd, '.project.json');
    if (_fs2.default.existsSync(configFile)) {
      const config = require(configFile);
      if (config.build) {
        cfg.sourceFolder = config.build.sourceFolder || cfg.sourceFolder;
        cfg.targetFolder = config.build.targetFolder || cfg.targetFolder;
        if (config.build.buildRequired !== undefined) {
          cfg.buildRequired = config.build.buildRequired;
        }

        cfg.deploy = config.deploy || {};
        if (cfg.deploy.destination) {
          cfg.deploy.system = cfg.deploy.system;
        }
      }
    }
  } catch (ex) {
    logger.writeln(logger.color.red('Error parsing .project.json file.'));
  }

  /* load config from neo-app.json */
  try {
    const configFile = _path2.default.join(cwd, 'neo-app.json');
    if (_fs2.default.existsSync(configFile)) {
      const config = require(configFile);
      let routes = config.routes || [];
      routes = routes.map(route => {
        const rv = {
          path: route.path
        };

        if (route.target.type === 'destination') {
          if (route.target.host) {
            rv.targetHost = route.target.host;
            rv.https = route.target.https || false;
          } else {
            rv.targetSystem = route.target.name;
          }
        } else if (route.target.type === 'service' && route.target.name === 'sapui5') {
          rv.targetHost = 'sapui5.hana.ondemand.com';
          if (route.target.serviceVersion) {
            rv.targetHost += '/' + route.target.serviceVersion;
          }
          rv.https = true;
        }
        return rv;
      });

      destinations = destinations.concat(routes);
    }
  } catch (ex) {
    logger.writeln(logger.color.red('Error parsing neo-app.json file.'));
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
      cfg.deploy = Object.assign({}, cfg.deploy, config.deploy);
    }
  } catch (ex) {
    logger.writeln(logger.color.red('Error parsing config.json file.'));
  }

  destinations = destinations.map(function (route) {
    if (route.targetSystem) {
      const logon = (0, _saplogonRead2.default)(route.targetSystem);
      if (!logon) {
        logger.writeln(logger.color.red(`Error: Unknown system ${logger.color.cyan(route.targetSystem || '')} for ${logger.color.yellow(route.path)}`));
        return null;
      }
      route.targetHost = logon.host;
    }
    if (!route.targetHost) {
      logger.writeln(logger.color.red(`Error: No target host for ${logger.color.yellow(route.path)}`));
      return null;
    }
    return {
      targetSystem: route.targetSystem,
      targetHost: route.targetHost,
      path: route.path,
      https: route.https || false
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
      logger.writeln(`Build disabled because no source folder defined.`);
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