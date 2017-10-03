import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import { logger } from '../utils';


function clean(dest) {
  return new Promise(function(resolve) {
    const dirname = path.relative(process.cwd(), dest);
    if (dirname === '' || dirname.startsWith('.')) {
      logger.writeln(logger.color.red('Error. No target folder specified for the project.'));
      resolve();
      return;
    }

    if (fs.existsSync(dest)) {
      rimraf(dest, function() {
        logger.writeln(`removing ${logger.color.red(dirname)} directory`);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

export default clean;