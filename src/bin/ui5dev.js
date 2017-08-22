#! /usr/bin/env node
import path from 'path';
import program from 'commander';

import clean from '../commands/clean';
import build from '../commands/build';
import serve from '../commands/serve';
import open from '../commands/open';

import { log, readConfig, validateSrc } from '../utils';


const config = readConfig();
const version = require('../../package.json').version;
const cwd = process.cwd();
const src = path.join(cwd, config.sourceFolder);
const dest = path.join(cwd, config.targetFolder);


program
  .command('clean')
  .action(function() {
    clean(dest);
  });

program
  .command('build')
  .action(function() {
    if (validateSrc(src, config.sourceFolder)) {
      clean(dest).then(() => {
        build(src, dest, {watch: false});
      });
    }
  });

program
  .command('serve')
  .option('-b, --open-browser [path]', 'Open browser')
  .action(function(options) {
    serve(dest, config.port, config.destinations);
    if (options.openBrowser) {
      open(options.openBrowser, config.port);
    }
  });

program
  .command('start')
  .option('-b, --open-browser [path]', 'Open browser')
  .action(function(options) {
    if (validateSrc(src, config.sourceFolder)) {
      clean(dest).then(() => {
        build(src, dest, {watch: true});
        serve(dest, config.port, config.destinations);
        if (options.openBrowser) {
          open(options.openBrowser, config.port);
        }
      });
    }
  });

program
  .command('open [path]')
  .action(function(path) {
    open(path, config.port);
  });

program
  .command('deploy')
  .action(function() {
    log('Deployment is not implemented yet! :(');
  });


program.version(version).parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}