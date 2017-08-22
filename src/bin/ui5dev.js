#! /usr/bin/env node
import path from 'path';
import program from 'commander';

import clean from '../commands/clean';
import build from '../commands/build';
import serve from '../commands/serve';
import open from '../commands/open';


const version = require('../../package.json').version;
const cwd = process.cwd();
const src = path.join(cwd, 'webapp');
const dest = path.join(cwd, 'dist');

program
  .command('clean')
  .action(function() {
    clean(dest);
  });

program
  .command('build')
  .action(function() {
    clean(dest).then(() => {
      build(src, dest, {watch: false});
    });
  });

program
  .command('serve')
  .option('-b, --open-browser [path]', 'Open browser')
  .action(function(options) {
    serve(dest);
    if (options.openBrowser) {
      open(options.openBrowser);
    }
  });

program
  .command('start')
  .option('-b, --open-browser [path]', 'Open browser')
  .action(function(options) {
    clean(dest).then(() => {
      build(src, dest, {watch: true});
      serve(dest);
      if (options.openBrowser) {
        open(options.openBrowser);
      }
    });
  });

program
  .command('open [path]')
  .action(function(path) {
    open(path);
  });

program
  .command('deploy')
  .action(function() {
    console.log('Deployment is not implemented yet! :(');
  });


program.version(version).parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}