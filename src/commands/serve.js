import path from 'path';
import url from 'url';
import express from 'express';
import morgan from 'morgan';
import proxy from 'http-proxy-middleware';
import HttpsProxyAgent from 'https-proxy-agent';
import { logger, getAvailableIPAddresses, splitHost } from '../utils';


function serve(dest, port, proxies) {
  const app = express();

  app.use(morgan('short'));
  app.use(express.static(dest));

  Object.entries(proxies).forEach(([path, options]) => {
    if (options.useCorporateProxy) {
      options.agent = new HttpsProxyAgent(options.useCorporateProxy);
    }
    app.use(path, proxy(options));
  });

  const server = app.listen(port, '0.0.0.0', function() {
    logger.writeln('Development server listening at:');
    getAvailableIPAddresses().forEach(ip => {
      logger.writeln('> ' + logger.color.yellow.underline(`http://${ip}:${port}/`));
    });

    const dir = path.relative(process.cwd(), dest);
    if (dir === '') {
      logger.writeln('and serving contend from current directory.');
    } else {
      logger.writeln(`and serving content from ${logger.color.yellow(dir)} directory.`);
    }

    if (Object.keys(proxies).length > 0) {
      logger.writeln('Loaded proxies:');
      Object.entries(proxies).forEach(([path, { target, system, useCorporateProxy }]) => {
        let logMsg = `> ${logger.color.yellow(path)} => ${logger.color.cyan(target)}`;
        if (path !== '*') {
          logMsg += logger.color.yellow(path);
        }
        if (system) {
          logMsg += ` (${system})`;
        }
        if (useCorporateProxy) {
          logMsg += ` (corporate proxy: ${useCorporateProxy})`;
        }
        logger.writeln(logMsg);
      });
    } else {
      logger.writeln(`No proxy loaded.`);
    }
  });
}

export default serve;
