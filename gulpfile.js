import gulp from "gulp"; // eslint-disable-line
import minifyCSS from "gulp-csso";
import minifyJS from "gulp-uglify";
import eslint from "gulp-eslint";
import stripDebug from "gulp-strip-debug";
import { deleteAsync } from "del";

const paths = {
  styles: {
    src: "src/css/*.css",
    dest: "build/src/css",
  },
  scripts: {
    src: "src/js/*.js",
    dest: "build/src/js",
  },
};

export function copyAssets() {
  return gulp
    .src(["./manifest.json", "./src/popup.html", "icons/**"], { base: "." })
    .pipe(gulp.dest("./build/"));
}

export function styles() {
  return gulp
    .src(paths.styles.src)
    .pipe(minifyCSS())
    .pipe(gulp.dest(paths.styles.dest));
}

export async function clean() {
  return deleteAsync(["./build/"]);
}

export function lint() {
  return gulp
    .src(paths.scripts.src)
    .pipe(eslint({ fix: true }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

export function scripts() {
  return gulp
    .src(paths.scripts.src)
    .pipe(stripDebug())
    .pipe(minifyJS())
    .pipe(gulp.dest(paths.scripts.dest));
}

const build = gulp.series(
  clean,
  lint,
  gulp.parallel(styles, scripts, copyAssets)
);

export default build;
