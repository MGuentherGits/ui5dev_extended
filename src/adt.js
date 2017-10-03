import http from 'http';
import path from 'path';
import fs from 'fs';
import xmldoc from 'xmldoc';
import { sync as isBinaryFile } from 'isbinaryfile';


const ADT_BASE_URL = '/sap/bc/adt';
const FILESTORE_BASE_URL = ADT_BASE_URL + '/filestore/ui5-bsp/objects'; 
const APPINDEX_BASE_URL = ADT_BASE_URL + '/filestore/ui5-bsp/appindex'; 

const SyncMode = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

const EntryType = {
  FOLDER: 'folder',
  FILE: 'file',
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
    filename: id.substr(lastIndex + separator.length),
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
      this.message = response.body;
    }
  }
};



class ADT {
  constructor(options) {
    this.options = options;
    this._session = {};
  }

  async syncFiles(files, cwd) {
  }

  async syncFolder(entry) {
    const requestOptions = {};

    switch (entry.syncMode) {
      case SyncMode.CREATE: {
        const entryId = extractPathAndFile(entry.id);
        Object.assign(requestOptions, {
          method: 'POST',
          path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entryId.path)}/content`,
          queryString: {
            type: 'folder',
            name: entryId.filename,
            isBinary: 'false',
            devclass: this.options.package,
            corrNr: this.options.transport,
          }
        });
        break;
      }

      case SyncMode.UPDATE: {
        // no action on update
        return;
      }

      case SyncMode.DELETE: {
        Object.assign(requestOptions, {
          method: 'DELETE',
          path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entry.id)}/content`,
          queryString: {
            deleteChildren: 'true',
            corrNr: this.options.transport,
          },
          headers: {
            'If-Match': '*',
          }
        });
        break;
      }
    }

    const response = await this._sendRequest(requestOptions);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return true;
    }
    throw new ServerError(response);
  }

  async syncFile(entry, cwd) {
    const requestOptions = {};

    switch (entry.syncMode) {
      case SyncMode.CREATE: {
        const filename = path.join(cwd, entry.localPath);
        const entryId = extractPathAndFile(entry.id);
        Object.assign(requestOptions, {
          method: 'POST',
          path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entryId.path)}/content`,
          queryString: {
            type: 'file',
            name: entryId.filename,
            isBinary: isBinaryFile(filename),
            charset: 'UTF-8',
            devclass: this.options.package,
            corrNr: this.options.transport,
          },
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: fs.readFileSync(filename), 
        });
        break;
      }

      case SyncMode.UPDATE: {
        const filename = path.join(cwd, entry.localPath);
        Object.assign(requestOptions, {
          method: 'PUT',
          path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entry.id)}/content`,
          queryString: {
            isBinary: isBinaryFile(filename),
            charset: 'UTF-8',
            corrNr: this.options.transport,
          },
          headers: {
            'Content-Type': 'application/octet-stream',
            'If-Match': '*',
          },
          body: fs.readFileSync(filename), 
        });
        break;
      }

      case SyncMode.DELETE: {
        Object.assign(requestOptions, {
          method: 'DELETE', 
          path: `${FILESTORE_BASE_URL}/${encodeURIComponent(entry.id)}/content`,
          queryString: {
            corrNr: this.options.transport,
          },
          headers: {
            'If-Match': '*',
          }
        });
        break;
      }
    }

    const response = await this._sendRequest(requestOptions);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return true;
    }
    throw new ServerError(response);
  }

  async createSession() {
    const response = await this._sendRequest({
      path: FILESTORE_BASE_URL,
      headers: { 'X-CSRF-Token': 'Fetch' }
    });
    if (response.statusCode === 200) {
      this._session = {
        'X-CSRF-Token': response.headers['x-csrf-token'],
        'Cookie': response.headers['set-cookie'],
      };
    }
  }

  getLocalEntries(files) {
    const { bspContainer } = this.options;

    const folders = files.reduce((folders, file) => {
      let dirname = path.dirname(file);
      while (dirname !== '.') {
        if (!folders.includes(dirname)) {
          folders.push(dirname);
        }
        dirname = path.dirname(dirname);
      }
      return folders;
    }, []);
    const localEntries = files.map(localPath => ({ localPath, type: 'file' }))
      .concat(folders.map(localPath => ({ localPath, type: 'folder' })));
    localEntries.forEach(entry => {
      entry.name = bspContainer + '/' + toUnixPath(entry.localPath);
      entry.id = encodePath(entry.name);
    });
    return localEntries;
  }

  getSyncEntries(serverEntries, localEntries) {
    const syncEntries = localEntries.map(localEntry => {
      const serverEntryExists = !!serverEntries.find(
        serverEntry => serverEntry.type === localEntry.type && serverEntry.id === localEntry.id
      );
      return Object.assign({}, localEntry, {syncMode: serverEntryExists ? SyncMode.UPDATE : SyncMode.CREATE});
    });
    serverEntries.forEach(serverEntry => {
      const localEntryExists = !!localEntries.find(
        localEntry => localEntry.type === serverEntry.type && localEntry.id === serverEntry.id
      );
      if (!localEntryExists) {
        syncEntries.push(Object.assign({}, serverEntry, {syncMode: SyncMode.DELETE}));
      }
    });
    return this._sortEntriesForProcessing(syncEntries);
  }

  _sortEntriesForProcessing(entries) {
    const files = entries.filter(file => file.type === EntryType.FILE);
    const folders = entries.filter(folder => folder.type === EntryType.FOLDER)
                         .map(folder => Object.assign({}, folder, {
                           level: folder.name.split('/').length - 1
                         }));

    const createFiles = files.filter(file => file.syncMode === SyncMode.CREATE);
    const updateFiles = files.filter(file => file.syncMode === SyncMode.UPDATE);
    const deleteFiles = files.filter(file => file.syncMode === SyncMode.DELETE);
    
    const createFolders = folders.filter(folder => folder.syncMode === SyncMode.CREATE);
    const updateFolders = folders.filter(folder => folder.syncMode === SyncMode.UPDATE);
    const deleteFolders = folders.filter(folder => folder.syncMode === SyncMode.DELETE);

    deleteFolders.sort((folderA, folderB) => folderB.level - folderA.level);  // highest level first
    createFolders.sort((folderA, folderB) => folderA.level - folderB.level);  // lowest level first

    return [].concat(
      deleteFiles,
      deleteFolders, 
      createFolders,
      updateFolders,  // not processed by ADT
      createFiles,
      updateFiles,
    );
  }

  async getEntryMetadata(entryId) {
    const path = `${FILESTORE_BASE_URL}/${encodeURIComponent(entryId)}`;
    const response = await this._sendRequest(path);
    if (response.statusCode === 200) {
      return {
        id: response.xml.valueWithPath('atom:id'),
        type: response.xml.valueWithPath('atom:category@term'),
        content: response.xml.valueWithPath('atom:content@src'),
        description: response.xml.valueWithPath('atom:summary'),
      }
    }
    else if (response.statusCode === 404) {
      return null;
    }
    else {
      throw new ServerError(response);
    }
  }

  async createBSPContainer(options) {
    const response = await this._sendRequest({
      method: 'POST',
      path: `${FILESTORE_BASE_URL}/%20/content`,
      queryString: {
        type: 'folder',
        isBinary: 'false',
        name: options.bspContainer,
        description: options.bspContainerDescription,
        devclass: options.package,
        corrNr: options.transport,
      }
    });
    return response.statusCode === 201;
  }

  async getServerEntries(folderName, recursive = true) {
    const path = `${FILESTORE_BASE_URL}/${encodeURIComponent(folderName)}/content`;
    const response = await this._sendRequest(path);
    if (response.statusCode === 200) {
      let entries = response.xml.childrenNamed('atom:entry').map(node => {
        const id = node.valueWithPath('atom:id');
        return {
          id: id,
          name: decodePath(id),
          type: node.valueWithPath('atom:category@term')
        };
      });

      if (recursive) {
        const folders = entries.filter(entry => entry.type === 'folder');
        for (let i = 0; i < folders.length; ++i) {
          const folder = folders[i];
          const subentries = await this.getServerEntries(folder.id);
          entries = entries.concat(subentries);
        }
      }

      entries.sort((entryA, entryB) => {
        return entryA.name.localeCompare(entryB.name);
      });

      return entries;
    } else if (response.statusCode === 404) {
      return null;
    } else {
      throw new ServerError(response);
    }
  }

  async calculateAppIndex(bspContainer) {
    const path = `${APPINDEX_BASE_URL}/${encodeURIComponent(bspContainer)}`;
    const response = await this._sendRequest(path);
    return response.statusCode === 200;
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
      headers: Object.assign({}, this._session, options.headers),
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

    return new Promise((resolve) => {
      const request = http.request(httpOptions, (response) => {
        response.setEncoding('utf8');
        response.body = '';
        response.xml = null;
              
        response.on('data', (chunk) => {
          response.body += chunk;
        });
  
        response.on('end', () => {
          try {
            response.xml = new xmldoc.XmlDocument(response.body);
          } catch(err) {}
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


export default ADT;
export { SyncMode, EntryType, ServerError };