const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const typescript = require('gulp-typescript').createProject('tsconfig.json');
const rename = require('gulp-rename');
const merge2 = require('merge2');
const del = require('del');

// This deletes all file from the lib folder
gulp.task('clear', () => {
  return del('packages/*/lib/*');
});

// This listens to changes, and re-runs the build task
gulp.task('default', ['build'], () =>
  gulp.watch('packages/*/src/**', ['build']),
);

// This uses both typescript and babel to transpile /src to /lib files.
gulp.task('build', ['clear'], () => {
  // Get all files as described in tsconfig.js
  const tsResult = typescript
    .src()
    // We start tracking all rewrites for the sourcemaps
    .pipe(sourcemaps.init())
    // Transpile to es2015 with the Typescript compiler
    .pipe(typescript());

  return (
    merge2(
      // Pass the declaration files as-is
      tsResult.dts,
      // Babel-ify the javascript files
      tsResult.js.pipe(
        babel({
          presets: ['env'],
          plugins: ['transform-runtime'],
        }),
      ),
    )
      // Rename */src to */lib
      .pipe(
        rename(path => {
          const newDirName = path.dirname.replace(
            /^([a-z-]+)\/src/,
            (_, p) => `${p}/lib`,
          );
          if (path.dirname === newDirName) {
            throw new Error('Tried to compile ' + JSON.stringify(path));
          }
          path.dirname = newDirName;
        }),
      )
      // Write the sourcemaps
      .pipe(sourcemaps.write('.', { sourceRoot: '.' }))
      // Write everything to the filesystem
      .pipe(gulp.dest('packages'))
  );
});
