#! /usr/bin/env node
import program from 'commander';

import clean from '../commands/clean';
import build from '../commands/build';
import serve from '../commands/serve';
import open from '../commands/open';

import { log, readConfig, validateBuild } from '../utils';


const config = readConfig();
const version = require('../../package.json').version;


function serveContent(options) {
  serve(config.dest, config.port, config.destinations);
  if (options.openBrowser) {
    open(options.openBrowser, config.port);
  }
}


program
  .command('clean')
  .action(function() {
    if (validateBuild(config)) {
      clean(config.dest);
    }
  });

program
  .command('build')
  .action(function() {
    if (validateBuild(config)) {
      clean(config.dest).then(() => {
        build(config.src, config.dest, {watch: false});
      });
    }
  });

program
  .command('serve')
  .option('-b, --open-browser [path]', 'Open browser')
  .action(function(options) {
    serveContent(options);
  });

program
  .command('start')
  .option('-b, --open-browser [path]', 'Open browser')
  .action(function(options) {
    if (config.buildRequired) {
      if (validateBuild(config)) {
        clean(config.dest).then(() => {
          build(config.src, config.dest, {watch: true});
          serveContent(options);
        });
      }
    } else {
      serveContent(options);
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