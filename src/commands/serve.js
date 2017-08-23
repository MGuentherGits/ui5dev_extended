import path from 'path';
import url from 'url';
import express from 'express';
import morgan from 'morgan';
import chalk from 'chalk';
import proxy from 'express-http-proxy';
import { log, getAvailableIPAddresses, splitHost } from '../utils';


function serve(dest, port, destinations) {
  const app = express();

  app.use(morgan('short'));
  app.use(express.static(dest));

  destinations.forEach(function(destination) {
    const { host, hostSufix } = splitHost(destination.targetHost);
    app.use(destination.path, proxy(host, {
      proxyReqPathResolver: req => hostSufix + destination.path + url.parse(req.url).path,
      https: destination.https,
    }));
  });

  const server = app.listen(port, '0.0.0.0', function() {
    log('Development server listening on:');
    getAvailableIPAddresses().forEach(ip => {
      log('> ' + chalk.yellow.underline(`http://${ip}:${port}/`));
    });

    const dir = path.relative(process.cwd(), dest);
    if (dir === '') {
      log('and serving contend from current directory.');
    } else {
      log(`and serving content from ${chalk.yellow(dir)} directory.`);
    }

    if (destinations.length > 0) {
      log('Loaded destinations:');
      destinations.forEach(destination => {
        const protocol = destination.https ? 'https://' : 'http://';
        let logMsg = `> ${chalk.yellow(destination.path)} => ${chalk.yellow(protocol)}${chalk.cyan(destination.targetHost)}${chalk.yellow(destination.path)}`;
        if (destination.targetSystem) {
          logMsg += ` (${destination.targetSystem})`;
        }
        log(logMsg);
      });
    } else {
      log(`No external destinations loaded.`);
    }
  });
}

export default serve;
