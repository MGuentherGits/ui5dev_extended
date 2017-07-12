#! /usr/bin/env node
import path from 'path';
import program from 'commander';

import clean from '../commands/clean';
import build from '../commands/build';
import serve from '../commands/serve';


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
  .action(function() {
    serve(dest);
  });

program
  .command('devserver')
  .action(function(args, next) {
    clean(dest).then(() => {
      build(src, dest, {watch: true});
      serve(dest);
    });
  });

program
  .command('deploy')
  .action(function() {
    console.log('Deploy', arguments);
  });
  

program.version(version).parse(process.argv);
