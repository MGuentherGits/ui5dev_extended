import url from 'url';
import express from 'express';
import morgan from 'morgan';
import chalk from 'chalk';
import proxy from 'express-http-proxy';
import { log, getAvailableIPAddresses } from '../utils';


function serve(dest, port, destinations) {
  const app = express();

  app.use(morgan('short'));
  app.use(express.static(dest));

  destinations.forEach(function(destination) {
    app.use(destination.path, proxy(destination.host, {
      proxyReqPathResolver: req => destination.path + url.parse(req.url).path,
      https: destination.https,
    }));
  });

  const server = app.listen(port, '0.0.0.0', function() {
    log(`Development server listening on:`);
    getAvailableIPAddresses().forEach(ip => {
      log(chalk.yellow.underline(`http://${ip}:${port}/`));
    });

    if (destinations.length > 0) {
      log('Destinations:');
      destinations.forEach(destination => {
        log(`${chalk.yellow(destination.path)} => ${chalk.cyan(destination.host)} (${destination.system})`);
      });
    } else {
      log(`No external destinations loaded.`);
    }
  });
}

export default serve;
