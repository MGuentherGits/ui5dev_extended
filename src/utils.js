import path from 'path';
import fs from 'fs';
import os from 'os';
import chalk from 'chalk';
import saplogon from 'saplogon-read';


export const log = console.log;


export function validateSrc(src, sourceFolder) {
  if (fs.existsSync(src)) {
    return true;
  }
  log(chalk.red(`Error: Missing \`${sourceFolder}\` folder. Are you in a correct directory?`));
  return false;
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
    sourceFolder: 'webapp',
    targetFolder: 'dist',
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
          system: route.target.name
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
      const routes = config.routes || [];
      destinations = destinations.concat(routes);

      cfg.sourceFolder = config.sourceFolder || cfg.sourceFolder;
      cfg.targetFolder = config.targetFolder || cfg.targetFolder;      
      cfg.port = config.port || cfg.port;
    }
  } catch (ex) {
    log(chalk.red('Error parsing config.json file.'));
  }

  destinations = destinations.map(function(route) {
    const logon = saplogon(route.system);
    if (!logon) {
      log(chalk.red(`Error: Unknown system ${chalk.cyan(route.system)} for ${chalk.yellow(route.path)}`));
      return null;
    }
    return {
      system: route.system,
      path: route.path,
      host: logon.host,
      https: false,
    };
  });
  cfg.destinations = destinations.filter(destination => destination !== null);

  return cfg;
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