import path from 'path';
import rimraf from 'rimraf';
import chalk from 'chalk';
import { log } from '../utils';


function clean(dest) {
  return new Promise(function(resolve) {
    const dirname = path.relative(process.cwd(), dest);
    rimraf(dest, function() {
      log(`deleting directory ${chalk.red(dirname)}`);
      resolve();
    });
  });
};

export default clean;