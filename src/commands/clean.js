import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import chalk from 'chalk';
import { log } from '../utils';


function clean(dest) {
  return new Promise(function(resolve) {
    const dirname = path.relative(process.cwd(), dest);
    if (dirname === '' || dirname.startsWith('.')) {
      log(chalk.red('Error. No target folder specified for the project.'));
      resolve();
      return;
    }

    if (fs.existsSync(dest)) {
      rimraf(dest, function() {
        log(`removing ${chalk.red(dirname)} directory`);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

export default clean;