#! /usr/bin/env node
import program from 'commander';
import prompt from 'prompt';

import clean from '../commands/clean';
import build from '../commands/build';
import serve from '../commands/serve';
import open from '../commands/open';
import deploy from '../commands/deploy';

import { readConfig, validateBuild, validateDeploy } from '../utils';


const config = readConfig();
const version = require('../../package.json').version;

prompt.message = '';
prompt.delimiter = ':';
prompt.colors = false;


function serveContent(options) {
  serve(config.dest, config.port, config.proxy);
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
      clean(config.dest)
      build(config.src, config.dest, {watch: false});
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
        clean(config.dest);
        serveContent(options);
        build(config.src, config.dest, {watch: true});
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
  .option('-t, --transport <transport>', 'Use transport')
  .option('-u, --user <user>', 'Auth user')
  .action(function({transport, user}) {
    const options = Object.assign({}, config.deploy, {transport, user});
    
    if (validateDeploy(options, config.dest)) {
      prompt.start();
      prompt.get([{
        name: 'password',
        description: 'Enter your password',
        hidden: true,
        replace: '*',
      }], function(err, {password}) {
        options.password = password; 
        deploy(config.dest, options);
      });
    };
  });


program.version(version).parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}