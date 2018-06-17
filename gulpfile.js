/*global require exports*/
// using gulp 4

var gulp = require('gulp');
var minifyCSS = require('gulp-csso');
var minifyJS = require('gulp-uglify');
var eslint = require('gulp-eslint');
var del = require('del');

var paths = {
  styles: {
    src: 'src/css/*.css',
    dest: 'build/src/css'
  },
  scripts: {
    src: 'src/js/*.js',
    dest: 'build/src/js'
  }
};

function copyAssets() {
  return gulp.src(['./src/popup.html', 'icons/**']).
        pipe(gulp.dest('./build/'));
}

function styles() {
  return gulp.src(paths.styles.src). // path to your file
    pipe(minifyCSS()).
    pipe(gulp.dest(paths.styles.dest));
}

function clean() {
  return del(['./build/']);
}

function lint() {
  return gulp.src(paths.scripts.src). // path to your file
    pipe(eslint()).
    pipe(eslint.format()).
    pipe(eslint.failAfterError());
}

function scripts () {
  return  gulp.src(paths.scripts.src). // path to your file
    pipe(minifyJS()).
    pipe(gulp.dest(paths.scripts.dest));
}

exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;


var build = gulp.series(clean, lint, gulp.parallel(styles, scripts, copyAssets));
gulp.task('default', build);
