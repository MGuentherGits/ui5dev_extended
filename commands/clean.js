const path = require('path');
const rimraf = require('rimraf');
const chalk = require('chalk');
const log = require('../utils').log;

module.exports = function clean(dest) {
  return new Promise(function(resolve) {
    const dirname = path.relative(process.cwd(), dest);
    rimraf(dest, function() {
      log(`deleting directory ${chalk.red(dirname)}`);
      resolve();
    });
  });
};
