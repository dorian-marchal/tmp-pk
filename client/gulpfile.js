/* eslint-disable no-sync */

var eslint = require('gulp-eslint');
var fs = require('fs');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var path = require('path');
var prepend = require('gulp-insert').prepend;
var uglify = require('gulp-uglify');
var webpack = require('webpack-stream');
var webpackConfig = require('./webpack.config.js');

function readUserscriptHeader() {
    var userscriptHeaderPath = path.join(__dirname, 'src', 'userscript', 'header.js');
    return fs.readFileSync(userscriptHeaderPath, 'utf8');
}

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

gulp.task('build', function() {
    return gulp.src(['./src/index.js'])
        .pipe(webpack(webpackConfig))
        .pipe(uglify())
        .pipe(prepend(readUserscriptHeader()))
        .pipe(gulp.dest('./dist'))
    ;
});

gulp.task('watch', function() {
    gulp.watch(['./src/**/*', './test/**/*', './package.json'], ['build']);
});
