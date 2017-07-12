import url from 'url';
import path from 'path';
import express from 'express';
import morgan from 'morgan';
import chalk from 'chalk';
import proxy from 'express-http-proxy';
import saplogon from 'saplogon-read';
import { log, generatePortNumber } from '../utils';


function getDestinations(dest) {
  const routes = require(path.join(path.dirname(dest), 'neo-app.json')).routes;
  return routes.map(function(route) {
    if (route.target.type === 'destination') {
      const system = route.target.name;
      const logon = saplogon(system);
      return {
        system,
        path: route.path,
        host: logon.host,
        https: false,
      };
    }

    return {
      path: route.path,
      host: 'sapui5.hana.ondemand.com',
      https: true,
    }
  });
}


function serve(dest) {
  const app = express();
  const port = generatePortNumber();
  const destinations = getDestinations(dest);

  app.use(morgan('short'));
  app.use(express.static(dest));

  destinations.forEach(function(destination) {
    app.use(destination.path, proxy(destination.host, {
      proxyReqPathResolver: req => destination.path + url.parse(req.url).path,
      https: destination.https,
    }));
  });

  const server = app.listen(port, '0.0.0.0', function() {
    const host = `http://127.0.0.1:${server.address().port}`;
    log(`Development server listening on ${chalk.yellow.underline(host)}`);
  });
}

export default serve;