import path from 'path';
import fs from 'fs';
import { logger } from '../utils';


function clean(dest) {
  const dirname = path.relative(process.cwd(), dest);
  if (dirname === '' || dirname.startsWith('.')) {
    logger.writeln(logger.color.red('Error. No target folder specified for the project.'));
    resolve();
    return;
  }

  if (fs.existsSync(dest)) {
    logger.writeln(`Cleaning ${logger.color.yellow(dirname)} directory`);
    rmDirSync(dest);
  }
};

function rmDirSync(dirpath, removeSelf = false) {
  const files = fs.readdirSync(dirpath);
  files.forEach(file => {
    const filepath = path.join(dirpath, file);
    if (fs.statSync(filepath).isFile()) {
      fs.unlinkSync(filepath);
    } else {
      rmDirSync(filepath, true);
    }
  });
  if (removeSelf) {
    fs.rmdirSync(dirpath);
  }
}

export default clean;