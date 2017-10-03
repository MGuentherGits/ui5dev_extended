import path from 'path';
import url from 'url';
import express from 'express';
import morgan from 'morgan';
import proxy from 'express-http-proxy';
import { logger, getAvailableIPAddresses, splitHost } from '../utils';


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
    logger.writeln('Development server listening on:');
    getAvailableIPAddresses().forEach(ip => {
      logger.writeln('> ' + logger.color.yellow.underline(`http://${ip}:${port}/`));
    });

    const dir = path.relative(process.cwd(), dest);
    if (dir === '') {
      logger.writeln('and serving contend from current directory.');
    } else {
      logger.writeln(`and serving content from ${logger.color.yellow(dir)} directory.`);
    }

    if (destinations.length > 0) {
      logger.writeln('Loaded destinations:');
      destinations.forEach(destination => {
        const protocol = destination.https ? 'https://' : 'http://';
        let logMsg = `> ${logger.color.yellow(destination.path)} => ${logger.color.yellow(protocol)}${logger.color.cyan(destination.targetHost)}${logger.color.yellow(destination.path)}`;
        if (destination.targetSystem) {
          logMsg += ` (${destination.targetSystem})`;
        }
        logger.writeln(logMsg);
      });
    } else {
      logger.writeln(`No external destinations loaded.`);
    }
  });
}

export default serve;
