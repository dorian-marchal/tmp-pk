var gulp = require('gulp');
var mocha = require('gulp-mocha');
var eslint = require('gulp-eslint');

gulp.task('lint', function() {
    return gulp.src(['./*.js', './src/**/*.js', './test/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
        .pipe(eslint.results(function(results) {
            if (results.warningCount > 0) {
                throw new Error('You must fix eslint warnings');
            }
        }))
    ;
});

gulp.task('test', function() {
    return gulp.src(['./test/**/*.js'])
        .pipe(mocha())
    ;
});
