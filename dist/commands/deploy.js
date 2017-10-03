'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

let deploy = (() => {
  var _ref = _asyncToGenerator(function* (dist, options) {
    const logon = (0, _saplogonRead2.default)(options.system);
    if (!logon) {
      log(`Deployment system ${options.system} not found.`);
      return;
    }

    const adtOptions = {
      server: logon.server,
      port: logon.port,
      client: options.client,
      auth: { user: options.user, password: options.password },
      transport: options.transport,
      package: options.package,
      bspContainer: options.name,
      bspContainerDescription: options.descripton || options.name
    };

    log(`Deploying applicaton to ${_utils.logger.color.cyan(options.system)}.`);
    log(`BSP Container: ${_utils.logger.color.yellow(options.name)}`);
    log(`Package: ${_utils.logger.color.yellow(options.package)}`);
    if (options.transport) {
      log(`Transport: ${_utils.logger.color.yellow(options.transport)}`);
    } else {
      log(`Transport: ${_utils.logger.color.gray('none')}`);
    }

    try {
      const { bspContainer } = adtOptions;
      const adt = new _adt2.default(adtOptions);

      const filelist = (0, _build.walkSync)(dist).map(function (filename) {
        return _path2.default.relative(dist, filename);
      });

      try {
        logAsyncSectionBegin('Analysing files for sync...');
        const serverEntries = yield adt.getServerEntries(bspContainer);
        const localEntries = adt.getLocalEntries(filelist);
        const syncEntries = adt.getSyncEntries(serverEntries || [], localEntries);
        logAsyncSectionEnd();

        if (syncEntries.length === 0) {
          log('Nothing to upload.');
          return;
        }

        // session is required for any POST, PUT and DELETE operations
        logAsyncSectionBegin('Creating upload session...');
        yield adt.createSession();
        logAsyncSectionEnd();

        const bspContainerExists = serverEntries !== null;
        if (!bspContainerExists) {
          logAsyncSectionBegin('Creating BSP container...');
          yield adt.createBSPContainer(adtOptions);
          logAsyncSectionEnd();
        }
        while (syncEntries.length > 0) {
          const entry = syncEntries.shift();
          if (entry.type === _adt.EntryType.FOLDER) {
            if (entry.syncMode === _adt.SyncMode.UPDATE) continue;
            const action = entry.syncMode === _adt.SyncMode.DELETE ? 'Removing' : 'Creating';
            logAsyncSectionBegin(`${action} folder ${_utils.logger.color.cyan(entry.name)}...`);
            yield adt.syncFolder(entry);
          } else {
            const action = entry.syncMode === _adt.SyncMode.DELETE ? 'Removing' : 'Uploading';
            logAsyncSectionBegin(`${action} ${_utils.logger.color.cyan(entry.name)}...`);
            yield adt.syncFile(entry, dist);
          }
          logAsyncSectionEnd();
        }

        logAsyncSectionBegin('Calculating application\'s index...');
        yield adt.calculateAppIndex(bspContainer);
        logAsyncSectionEnd();

        log('The application has been deployed.');
      } catch (error) {
        log(_utils.logger.color.red('[FAIL]'));
        if (error instanceof _adt.ServerError) {
          log(`Server response: ${_utils.logger.color.yellow(error.statusCode + ' ' + error.statusMessage)}`);
          log(_utils.logger.color.red(error.message));
        } else {
          log(_utils.logger.color.red(error));
        }
      }
    } catch (error) {
      log(_utils.logger.color.red(error));
    }
  });

  return function deploy(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _saplogonRead = require('saplogon-read');

var _saplogonRead2 = _interopRequireDefault(_saplogonRead);

var _adt = require('../adt');

var _adt2 = _interopRequireDefault(_adt);

var _build = require('./build');

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function logAsyncSectionBegin(...args) {
  _utils.logger.write(...args);
}

function logAsyncSectionEnd() {
  _utils.logger.writeln(_utils.logger.color.green('[OK]'));
}

function log(...args) {
  _utils.logger.writeln(...args);
}

exports.default = deploy;