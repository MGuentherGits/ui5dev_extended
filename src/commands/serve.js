import express from 'express';
import morgan from 'morgan';
import chalk from 'chalk';
import { log } from '../utils';


function serve(dest, port) {
  const app = express();
  app.use(morgan('short'));
  app.use(express.static(dest));

  const server = app.listen(port, '0.0.0.0', function() {
    const host = `http://127.0.0.1:${server.address().port}`;
    log(`Development server listening on ${chalk.yellow.underline(host)}`);
  });
}

export default serve;