import path from 'path';
import saplogon from 'saplogon-read';
import ADT, { SyncMode, EntryType, ServerError } from '../adt';
import { walkSync } from './build';
import { logger } from '../utils';


function logAsyncSectionBegin(...args) {
  logger.write(...args);
}

function logAsyncSectionEnd() {
  logger.writeln(logger.color.green('[OK]'));
}

function log(...args) {
  logger.writeln(...args);
}


async function deploy(dist, options) {
  const logon = saplogon(options.system);  
  if (!logon) {
    log(`Deployment system ${options.system} not found.`);
    return;
  }
  
  const adtOptions = {
    server: logon.server,
    port: logon.port,
    client: options.client,
    auth: { user: options.user, password: options.password, },
    transport: options.transport,
    package: options.package,
    bspContainer: options.name,
    bspContainerDescription: options.descripton || options.name,
  }

  log(`Deploying applicaton to ${logger.color.cyan(options.system)}.`);
  log(`BSP Container: ${logger.color.yellow(options.name)}`);
  log(`Package: ${logger.color.yellow(options.package)}`);
  if (options.transport) {
    log(`Transport: ${logger.color.yellow(options.transport)}`);
  } else {
    log(`Transport: ${logger.color.gray('none')}`);
  }

  try {
    const { bspContainer } = adtOptions;
    const adt = new ADT(adtOptions);

    const filelist = walkSync(dist)
      .map(filename => path.relative(dist, filename)); 
    
    try {
      logAsyncSectionBegin('Analysing files for sync...');
      const serverEntries = await adt.getServerEntries(bspContainer);
      const localEntries = adt.getLocalEntries(filelist);
      const syncEntries = adt.getSyncEntries(serverEntries || [], localEntries);
      logAsyncSectionEnd();

      if (syncEntries.length === 0) {
        log('Nothing to upload.');
        return;
      }
      
      // session is required for any POST, PUT and DELETE operations
      logAsyncSectionBegin('Creating upload session...');
      await adt.createSession();
      logAsyncSectionEnd();

      const bspContainerExists = serverEntries !== null;
      if (!bspContainerExists) {
        logAsyncSectionBegin('Creating BSP container...');
        await adt.createBSPContainer(adtOptions);
        logAsyncSectionEnd();
      }
      while (syncEntries.length > 0) {
        const entry = syncEntries.shift();
        if (entry.type === EntryType.FOLDER) {
          if (entry.syncMode === SyncMode.UPDATE) continue;
          const action = entry.syncMode === SyncMode.DELETE ? 'Removing' : 'Creating';
          logAsyncSectionBegin(`${action} folder ${logger.color.cyan(entry.name)}...`);
          await adt.syncFolder(entry);
        } else {
          const action = entry.syncMode === SyncMode.DELETE ? 'Removing' : 'Uploading';
          logAsyncSectionBegin(`${action} ${logger.color.cyan(entry.name)}...`);
          await adt.syncFile(entry, dist);
        }
        logAsyncSectionEnd();
      }

      logAsyncSectionBegin('Calculating application\'s index...');
      await adt.calculateAppIndex(bspContainer);
      logAsyncSectionEnd();

      log('The application has been deployed.');
    }
    catch (error) {
      log(logger.color.red('[FAIL]'));
      if (error instanceof ServerError) {
        log(`Server response: ${logger.color.yellow(error.statusCode + ' ' + error.statusMessage)}`);
        log(logger.color.red(error.message));
      } else {
        log(logger.color.red(error));
      }
    }
  } catch (error) {
    log(logger.color.red(error));
  }
}

export default deploy;