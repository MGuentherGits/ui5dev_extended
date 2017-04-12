const path = require('path');
const fs = require('fs');

const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const outputFileSync = require('output-file-sync');
const chalk = require('chalk');

const log = require('../utils').log;

const babelrc = {
  presets: [
    ['env', {targets: {browsers: ['last 2 versions', 'ie >= 11']}, modules: false}]
  ]
};

function walkSync(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    const filename = path.join(dir, file);
    if (fs.statSync(filename).isDirectory()) {
      filelist = walkSync(filename, filelist);
    }
    else {
      filelist.push(filename);
    }
  });
  return filelist;
};

function canCompile(filename) {
  return ['.js'].includes(path.extname(filename));
}

function handleFile(src, dest, filename) {
  canCompile(filename)
    ? compileFile(src, dest, filename)
    : copyFile(src, dest, filename);
}

function compileFile(src, dest, filename) {
  rollup.rollup({
    entry: path.join(src, filename),
    plugins: [babel(babelrc)]
  }).then(function(bundle) {
    log(`compiling ${chalk.green(filename)}`);
    bundle.write({
      format: 'cjs',
      dest: path.join(dest, filename)
    });
  });
}

function copyFile(src, dest, filename) {
  log(`copying ${chalk.cyan(filename)}`);

  outputFileSync(
    path.join(dest, filename),
    fs.readFileSync(path.join(src, filename))
  );
}


module.exports = function build(src, dest, options = {}) {
  const filelist = walkSync(src)
    .map(filename => path.relative(src, filename));

  filelist.forEach(filename => handleFile(src, dest, filename));

  if (options.watch) {
    const watcher = require('chokidar').watch(src, {recursive: true, ignoreInitial: true});
    ['add', 'change'].forEach(eventType => {
      watcher.on(eventType, filename => {
        handleFile(src, dest, path.relative(src, filename));
      });
    });
  }
}
