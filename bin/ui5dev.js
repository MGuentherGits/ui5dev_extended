#! /usr/bin/env node
const path = require('path');
const version = require('../package.json').version;
const program = require('commander');

const clean = require('../commands/clean');
const build = require('../commands/build');

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
  

program.parse(process.argv);
