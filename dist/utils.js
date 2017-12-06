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
exports.expandSystemUrl = expandSystemUrl;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

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
    proxy: {}
  };

  const cwd = process.cwd();

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
  } catch (error) {
    logger.writeln(logger.color.red('Error parsing .project.json file.'));
    logger.writeln(logger.color.red(error));
  }

  /* load config from neo-app.json */
  try {
    const configFile = _path2.default.join(cwd, 'neo-app.json');
    if (_fs2.default.existsSync(configFile)) {
      const config = require(configFile);
      let routes = config.routes || [];
      routes = routes.forEach(route => {
        if (route.target.type === 'destination') {
          cfg.proxy[route.path] = { target: route.target.name };
        } else if (route.target.type === 'service' && route.target.name === 'sapui5') {
          const libraryVersion = route.target.libraryVersion || 'sdk';
          cfg.proxy[route.path] = { target: 'https://sapui5.hana.ondemand.com/' + libraryVersion };
        }
      });
    }
  } catch (error) {
    logger.writeln(logger.color.red('Error parsing neo-app.json file.'));
    logger.writeln(logger.color.red(error));
  }

  /* load config from ui5dev.config.json */
  try {
    const configFile = _path2.default.join(cwd, 'ui5dev.config.json');
    if (_fs2.default.existsSync(configFile)) {
      const config = require(configFile);

      if (typeof config.proxy === 'string') {
        try {
          const options = {};
          const target = expandSystemUrl(config.proxy, options);
          cfg.proxy = {
            '/resources': Object.assign({ target: target + '/sap/public/bc/ui5_ui5/1' }, options),
            '*': Object.assign({ target }, options)
          };
        } catch (error) {
          logger.writeln(`Unknown system in your proxy settings.`);
        }
      } else if (typeof config.proxy === 'object') {
        Object.keys(config.proxy).forEach(path => {
          let proxyOptions = config.proxy[path];
          if (typeof proxyOptions === 'string') {
            proxyOptions = { target: proxyOptions };
          }
          cfg.proxy[path] = proxyOptions;
        });
      }

      cfg.sourceFolder = config.sourceFolder || cfg.sourceFolder;
      cfg.targetFolder = config.targetFolder || cfg.targetFolder;
      cfg.port = config.port || cfg.port;
      if (config.buildRequired !== undefined) {
        cfg.buildRequired = config.buildRequired;
      }
      cfg.deploy = Object.assign({}, cfg.deploy, config.deploy);
    }
  } catch (error) {
    logger.writeln(logger.color.red('Error parsing ui5dev.config.json file.'));
    logger.writeln(logger.color.red(error));
  }

  Object.keys(cfg.proxy).forEach(path => {
    const proxyOptions = cfg.proxy[path];
    try {
      proxyOptions.target = expandSystemUrl(proxyOptions.target, proxyOptions);
    } catch (error) {
      logger.writeln(logger.color.red(`Unknown system ${logger.color.yellow(proxyOptions.system)} for path ${logger.color.yellow(path)} in your proxy setting.`));
      delete cfg.proxy[path];
      return;
    }
    if (typeof proxyOptions.changeOrigin === 'undefined') {
      proxyOptions.changeOrigin = true;
    }
    if (typeof proxyOptions.logLevel === 'undefined') {
      proxyOptions.logLevel = 'warn';
    }
    if (proxyOptions.useCorporateProxy && proxyOptions.useCorporateProxy === true) {
      const proxyServer = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      if (!proxyServer) {
        logger.writeln(logger.color.red(`Unknown corporate proxy server for path ${logger.color.yellow(path)}.`));
        logger.writeln(logger.color.red(`Give full url to the proxy server or set ${logger.color.yellow('HTTPS_PROXY')} or ${logger.color.yellow('HTTP_PROXY')} environment variable.`));
      }
      proxyOptions.useCorporateProxy = proxyServer;
    }
    cfg.proxy[path] = proxyOptions;
  });

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

function expandSystemUrl(url_, info = {}) {
  let parts = {};
  let system;
  if (url_.match(/^[a-z0-9]{1,3}$/gi)) {
    system = url_;
  } else {
    parts = _url2.default.parse(url_);
    if (['sap:', 'sap-system:'].includes(parts.protocol)) {
      system = parts.hostname.toUpperCase();
    }
  }

  if (system) {
    info.system = system;
    const logon = (0, _saplogonRead2.default)(system);
    if (!logon) {
      throw Error(`Unknown system ${system}.`);
    }
    return _url2.default.format({
      protocol: 'http',
      hostname: logon.server,
      port: logon.port,
      path: parts.path
    });
  }
  return url_;
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