'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ServerError = exports.EntryType = exports.SyncMode = undefined;

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _xmldoc = require('xmldoc');

var _xmldoc2 = _interopRequireDefault(_xmldoc);

var _isbinaryfile = require('isbinaryfile');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const ADT_BASE_URL = '/sap/bc/adt';
const FILESTORE_BASE_URL = ADT_BASE_URL + '/filestore/ui5-bsp/objects';
const APPINDEX_BASE_URL = ADT_BASE_URL + '/filestore/ui5-bsp/appindex';

const SyncMode = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

const EntryType = {
  FOLDER: 'folder',
  FILE: 'file'
};

function encodePath(path) {
  return path.replace(new RegExp('/', 'g'), '%2f');
}

function decodePath(path) {
  return path.replace(new RegExp('%2f', 'g'), '/');
}

function extractPathAndFile(id, separator = '%2f') {
  const lastIndex = id.lastIndexOf(separator);
  return {
    path: id.substr(0, lastIndex),
    filename: id.substr(lastIndex + separator.length)
  };
}

function toUnixPath(path) {
  return path.replace(new RegExp('\\\\', 'g'), '/');
}

class ServerError extends Error {
  constructor(response) {
    super();
    this.statusCode = response.statusCode;
    this.statusMessage = response.statusMessage;
    try {
      this.message = response.xml.valueWithPath('message');
    } catch (error) {
      const header = response.req.method + ' ' + response.req.path;
      this.message = header + '\n' + response.body;
    }
  }
};

class ADT {
  constructor(options) {
    this.options = options;
    this._session = {};
  }

  syncFiles(files, cwd) {
    return _asyncToGenerator(function* () {})();
  }

  syncFolder(entry) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const requestOptions = {};

      switch (entry.syncMode) {
        case SyncMode.CREATE:
          {
            const entryId = extractPathAndFile(entry.id);
            Object.assign(requestOptions, {
              method: 'POST',
              path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entryId.path)}/content`,
              queryString: {
                type: 'folder',
                name: entryId.filename,
                isBinary: 'false',
                devclass: _this.options.package,
                corrNr: _this.options.transport
              }
            });
            break;
          }

        case SyncMode.UPDATE:
          {
            // no action on update
            return;
          }

        case SyncMode.DELETE:
          {
            Object.assign(requestOptions, {
              method: 'DELETE',
              path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entry.id)}/content`,
              queryString: {
                deleteChildren: 'true',
                corrNr: _this.options.transport
              },
              headers: {
                'If-Match': '*'
              }
            });
            break;
          }
      }

      const response = yield _this._sendRequest(requestOptions);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return true;
      }
      throw new ServerError(response);
    })();
  }

  syncFile(entry, cwd) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const requestOptions = {};

      switch (entry.syncMode) {
        case SyncMode.CREATE:
          {
            const filename = _path2.default.join(cwd, entry.localPath);
            const entryId = extractPathAndFile(entry.id);
            Object.assign(requestOptions, {
              method: 'POST',
              path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entryId.path)}/content`,
              queryString: {
                type: 'file',
                name: entryId.filename,
                isBinary: (0, _isbinaryfile.sync)(filename),
                charset: 'UTF-8',
                devclass: _this2.options.package,
                corrNr: _this2.options.transport
              },
              headers: {
                'Content-Type': 'application/octet-stream'
              },
              body: _fs2.default.readFileSync(filename)
            });
            break;
          }

        case SyncMode.UPDATE:
          {
            const filename = _path2.default.join(cwd, entry.localPath);
            Object.assign(requestOptions, {
              method: 'PUT',
              path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entry.id)}/content`,
              queryString: {
                isBinary: (0, _isbinaryfile.sync)(filename),
                charset: 'UTF-8',
                corrNr: _this2.options.transport
              },
              headers: {
                'Content-Type': 'application/octet-stream',
                'If-Match': '*'
              },
              body: _fs2.default.readFileSync(filename)
            });
            break;
          }

        case SyncMode.DELETE:
          {
            Object.assign(requestOptions, {
              method: 'DELETE',
              path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entry.id)}/content`,
              queryString: {
                corrNr: _this2.options.transport
              },
              headers: {
                'If-Match': '*'
              }
            });
            break;
          }
      }

      const response = yield _this2._sendRequest(requestOptions);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return true;
      }
      throw new ServerError(response);
    })();
  }

  createSession() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const response = yield _this3._sendRequest({
        path: FILESTORE_BASE_URL,
        headers: { 'X-CSRF-Token': 'Fetch' }
      });
      if (response.statusCode === 200) {
        _this3._session = {
          'X-CSRF-Token': response.headers['x-csrf-token'],
          'Cookie': response.headers['set-cookie']
        };
      }
    })();
  }

  getLocalEntries(files) {
    const { bspContainer } = this.options;

    const folders = files.reduce((folders, file) => {
      let dirname = _path2.default.dirname(file);
      while (dirname !== '.') {
        if (!folders.includes(dirname)) {
          folders.push(dirname);
        }
        dirname = _path2.default.dirname(dirname);
      }
      return folders;
    }, []);
    const localEntries = files.map(localPath => ({ localPath, type: 'file' })).concat(folders.map(localPath => ({ localPath, type: 'folder' })));
    localEntries.forEach(entry => {
      entry.name = bspContainer + '/' + toUnixPath(entry.localPath);
      entry.id = encodePath(entry.name);
    });
    return localEntries;
  }

  getSyncEntries(serverEntries, localEntries) {
    const syncEntries = localEntries.map(localEntry => {
      const serverEntryExists = !!serverEntries.find(serverEntry => serverEntry.type === localEntry.type && serverEntry.id === localEntry.id);
      return Object.assign({}, localEntry, { syncMode: serverEntryExists ? SyncMode.UPDATE : SyncMode.CREATE });
    });
    serverEntries.forEach(serverEntry => {
      const localEntryExists = !!localEntries.find(localEntry => localEntry.type === serverEntry.type && localEntry.id === serverEntry.id);
      if (!localEntryExists) {
        syncEntries.push(Object.assign({}, serverEntry, { syncMode: SyncMode.DELETE }));
      }
    });
    return this._sortEntriesForProcessing(syncEntries);
  }

  _sortEntriesForProcessing(entries) {
    const files = entries.filter(file => file.type === EntryType.FILE);
    const folders = entries.filter(folder => folder.type === EntryType.FOLDER).map(folder => Object.assign({}, folder, {
      level: folder.name.split('/').length - 1
    }));

    const createFiles = files.filter(file => file.syncMode === SyncMode.CREATE);
    const updateFiles = files.filter(file => file.syncMode === SyncMode.UPDATE);
    const deleteFiles = files.filter(file => file.syncMode === SyncMode.DELETE);

    const createFolders = folders.filter(folder => folder.syncMode === SyncMode.CREATE);
    const updateFolders = folders.filter(folder => folder.syncMode === SyncMode.UPDATE);
    const deleteFolders = folders.filter(folder => folder.syncMode === SyncMode.DELETE);

    deleteFolders.sort((folderA, folderB) => folderB.level - folderA.level); // highest level first
    createFolders.sort((folderA, folderB) => folderA.level - folderB.level); // lowest level first

    return [].concat(deleteFiles, deleteFolders, createFolders, updateFolders, // not processed by ADT
    createFiles, updateFiles);
  }

  getEntryMetadata(entryId) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      const path = `${FILESTORE_BASE_URL}/${encodeURIComponent(entryId)}`;
      const response = yield _this4._sendRequest(path);
      if (response.statusCode === 200) {
        return {
          id: response.xml.valueWithPath('atom:id'),
          type: response.xml.valueWithPath('atom:category@term'),
          content: response.xml.valueWithPath('atom:content@src'),
          description: response.xml.valueWithPath('atom:summary')
        };
      } else if (response.statusCode === 404) {
        return null;
      } else {
        throw new ServerError(response);
      }
    })();
  }

  createBSPContainer(options) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const response = yield _this5._sendRequest({
        method: 'POST',
        path: `${FILESTORE_BASE_URL}/%20/content`,
        queryString: {
          type: 'folder',
          isBinary: 'false',
          name: options.bspContainer,
          description: options.bspContainerDescription,
          devclass: options.package,
          corrNr: options.transport
        }
      });
      return response.statusCode === 201;
    })();
  }

  getServerEntries(folderName, recursive = true) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      const path = `${FILESTORE_BASE_URL}/${encodeURIComponent(folderName)}/content`;
      const response = yield _this6._sendRequest(path);
      if (response.statusCode === 200) {
        let entries = response.xml.childrenNamed('atom:entry').map(function (node) {
          const id = node.valueWithPath('atom:id');
          return {
            id: id,
            name: decodePath(id),
            type: node.valueWithPath('atom:category@term')
          };
        });

        if (recursive) {
          const folders = entries.filter(function (entry) {
            return entry.type === 'folder';
          });
          for (let i = 0; i < folders.length; ++i) {
            const folder = folders[i];
            const subentries = yield _this6.getServerEntries(folder.id);
            entries = entries.concat(subentries);
          }
        }

        entries.sort(function (entryA, entryB) {
          return entryA.name.localeCompare(entryB.name);
        });

        return entries;
      } else if (response.statusCode === 404) {
        return null;
      } else {
        throw new ServerError(response);
      }
    })();
  }

  calculateAppIndex(bspContainer) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      const path = `${APPINDEX_BASE_URL}/${encodeURIComponent(bspContainer)}`;
      const response = yield _this7._sendRequest(path);
      return response.statusCode === 200;
    })();
  }

  _sendRequest(options) {
    if (typeof options === 'string') {
      options = { path: options };
    }

    const httpOptions = {
      hostname: this.options.server,
      port: this.options.port,
      auth: this.options.auth.user + ':' + this.options.auth.password,
      method: options.method || 'GET',
      path: options.path,
      headers: Object.assign({}, this._session, options.headers)
    };

    if (this.options.client) {
      options.queryString = options.queryString || {};
      options.queryString['sap-client'] = this.options.client;
    }

    if (options.queryString) {
      const params = [];
      Object.entries(options.queryString).forEach(([key, value]) => {
        if (value !== undefined) {
          params.push(key + '=' + encodeURIComponent(value));
        }
      });
      const queryString = params.join('&');
      if (queryString) {
        httpOptions.path += '?' + queryString;
      }
    }

    return new Promise(resolve => {
      const request = _http2.default.request(httpOptions, response => {
        response.setEncoding('utf8');
        response.body = '';
        response.xml = null;

        response.on('data', chunk => {
          response.body += chunk;
        });

        response.on('end', () => {
          try {
            response.xml = new _xmldoc2.default.XmlDocument(response.body);
          } catch (err) {}
          resolve(response);
        });
      });

      if (options.body) {
        request.write(options.body);
      }
      request.end();
    });
  }
}

exports.default = ADT;
exports.SyncMode = SyncMode;
exports.EntryType = EntryType;
exports.ServerError = ServerError;