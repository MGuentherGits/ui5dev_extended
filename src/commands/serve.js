import url from 'url';
import path from 'path';
import fs from 'fs';
import express from 'express';
import morgan from 'morgan';
import chalk from 'chalk';
import proxy from 'express-http-proxy';
import saplogon from 'saplogon-read';
import { log, generatePortNumber, getHostName } from '../utils';


function getDestinations(dest) {
  const cwd = path.dirname(dest);
  let destinations = [];
  
  /* load config from neo-app.json */
  try {
    const configFile = path.join(cwd, 'neo-app.json');
    if (fs.existsSync(configFile)) {
      let routes = require(configFile).routes;
      routes = routes.filter(r => r.target.type === 'destination').map(route => {
        return {
          path: route.path,
          system: route.target.name
        }
      });
      destinations = destinations.concat(routes);
    }
  } catch (ex) {
    log(`${chalk.red('Error parsing neo-app.json file.')}`);
  }

  /* load config from config.json */
  try {
    const configFile = path.join(cwd, 'config.json');
    if (fs.existsSync(configFile)) {
      let routes = require(configFile).routes;
      destinations = destinations.concat(routes);
    }
  } catch (ex) {
    log(`${chalk.red('Error parsing config.json file.')}`);
  }

  destinations = destinations.map(function(route) {
    const logon = saplogon(route.system);
    if (!logon) {
      log(`${chalk.red('Error')}: Unknown system ${chalk.cyan(route.system)} for ${chalk.yellow(route.path)}`);
      return null;
    }
    return {
      system: route.system,
      path: route.path,
      host: logon.host,
      https: false,
    };
  });
  return destinations.filter(destination => destination !== null);
}


function serve(dest) {
  const app = express();
  const destinations = getDestinations(dest);
  const port = generatePortNumber();

  app.use(morgan('short'));
  app.use(express.static(dest));

  destinations.forEach(function(destination) {
    app.use(destination.path, proxy(destination.host, {
      proxyReqPathResolver: req => destination.path + url.parse(req.url).path,
      https: destination.https,
    }));
  });

  const server = app.listen(port, '0.0.0.0', function() {
    const host = getHostName(port);

    log(`Development server listening on ${chalk.yellow.underline(host)}`);
    if (destinations.length > 0) {
      destinations.forEach(destination => {
        log(`destination: ${chalk.yellow(destination.path)} => ${chalk.cyan(destination.host)} (${destination.system})`);
      });
    } else {
      log(`No external destinations loaded.`);
    }
  });
}

export default serve;
