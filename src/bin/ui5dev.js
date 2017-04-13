#! /usr/bin/env node
import path from 'path';
import program from 'commander';

import clean from '../commands/clean';
import build from '../commands/build';

const version = require('../../package.json').version;
const src = path.join(process.cwd(), 'webapp');
const dest = path.join(process.cwd(), 'dist');

program
  .command('clean')
  .action(function() {
    clean(dest);
  });

program
  .command('build')
  .action(function() {
    clean(dest).then(() => {
      build(src, dest, {watch: true});
    });
  });

program
  .command('start')
  .action(function(args, next) {
    console.log(`Running ${args} from ${process.cwd()}`);
  });

program
  .command('deploy')
  .action(function() {
    console.log('Deploy', arguments);
  });
  

program.version(version).parse(process.argv);
