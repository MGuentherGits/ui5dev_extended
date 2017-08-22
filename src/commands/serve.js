import url from 'url';
import express from 'express';
import morgan from 'morgan';
import chalk from 'chalk';
import proxy from 'express-http-proxy';
import { log } from '../utils';


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
    const host = `http://127.0.0.1:${port}/`;
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
