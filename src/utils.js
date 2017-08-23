import path from 'path';
import fs from 'fs';
import os from 'os';
import chalk from 'chalk';
import saplogon from 'saplogon-read';


export const log = console.log;


export function validateBuild(config) {
  if (!config.buildRequired) {
    log(chalk.red('Command not valid - no active build configration for this project.'));
    return false;
  }

  if (!fs.existsSync(config.src)) {
    log(chalk.red(`Error: Missing \`${config.sourceFolder}\` folder.`));
    return false;
  }

  return true;
}


export function getAvailableIPAddresses() {
  const ifaces = os.networkInterfaces();
  return Object.values(ifaces)
               .reduce(function(arr, entry) { return arr.concat(entry); }, [])
               .filter(entry => entry.family === 'IPv4')
               .map(entry => entry.address);
}


export function readConfig() {
  const cfg = {
    sourceFolder: '',
    targetFolder: '',
    buildRequired: null,
    port: generatePortNumber(),
    destinations: [],
  };

  const cwd = process.cwd();
  let destinations = [];

  /* load config from .project.json */
  try {
    const configFile = path.join(cwd, 'neo-app.json');
    if (fs.existsSync(configFile)) {
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
    log(chalk.red('Error parsing .project.json file.'));
  }
  
  /* load config from neo-app.json */
  try {
    const configFile = path.join(cwd, 'neo-app.json');
    if (fs.existsSync(configFile)) {
      const config = require(configFile);
      let routes = config.routes || [];
      routes = routes.filter(r => r.target.type === 'destination').map(route => {
        return {
          path: route.path,
          targetSystem: route.target.name
        }
      });
      destinations = destinations.concat(routes);
    }
  } catch (ex) {
    log(chalk.red('Error parsing neo-app.json file.'));
  }

  /* load config from config.json */
  try {
    const configFile = path.join(cwd, 'config.json');
    if (fs.existsSync(configFile)) {
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
    log(chalk.red('Error parsing config.json file.'));
  }

  destinations = destinations.map(function(route) {
    const logon = saplogon(route.targetSystem);
    if (!logon) {
      log(chalk.red(`Error: Unknown system ${chalk.cyan(route.targetSystem || '')} for ${chalk.yellow(route.path)}`));
      return null;
    }
    return {
      targetSystem: route.targetSystem,
      path: route.path,
      host: logon.host,
      https: false,
    };
  });
  cfg.destinations = destinations.filter(destination => destination !== null);

  // check if we can use webapp folder
  if (cfg.sourceFolder === '') {
    const webappFolder = path.join(cwd, 'webapp');
    if (fs.existsSync(webappFolder)) {
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

  cfg.src = path.join(cwd, cfg.sourceFolder);
  cfg.dest = path.join(cwd, cfg.targetFolder);

  return cfg;
}


export function isSameDirectory(dir1, dir2) {
  return path.relative(dir1, dir2) === '';
}


/**
 * Generates port number based on directory name.
 **/
function generatePortNumber() {
  const s = path.basename(process.cwd());
  if (s.length < 4) {
    return 3001;
  }
  const base = 2 * s.charCodeAt(1) + s.charCodeAt(2) + s.charCodeAt(s.length - 3) + s.charCodeAt(s.length - 1);
  return 3000 + base % 1000;
}