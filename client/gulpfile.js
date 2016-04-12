/* eslint-disable no-sync, global-require */

var argv = require('yargs').argv;
var eslint = require('gulp-eslint');
var exec = require('child_process').exec;
var fs = require('fs');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var mocha = require('gulp-mocha');
var os = require('os');
var path = require('path');
var plumber = require('gulp-plumber');
var prepend = require('gulp-insert').prepend;
var uglify = require('gulp-uglify');
var UserscriptHeader = require('userscript-header');
var webpack = require('webpack-stream');
var webpackConfig = require('./webpack.config.js');

var packagePath = path.join(__dirname, 'package.json');

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

/**
 * Builds userscript file. Run it with --dev option to prevent minification.
 */
gulp.task('build', ['build-config'], function() {

    if (argv.dev) {
        webpackConfig.entry = './src/index.dev.js';
    }
    else {
        // Strip out console.log in production.
        webpackConfig.module.loaders.push({
            test: /\.js$/,
            loader: 'strip?strip[]=console.log',
        });
    }

    return gulp.src(webpackConfig.entry)
        .pipe(plumber())
        .pipe(webpack(webpackConfig))
        .pipe(gulpif(!argv.dev, (uglify())))
        .pipe(prepend(UserscriptHeader.fromPackage(packagePath).toString()))
        .pipe(gulp.dest('./dist'))
    ;
});

/**
 * Builds JSON config file from JS config source.
 */
gulp.task('build-config', function() {
    var configSrcPath = './src/config/pokemon-data.js';
    var configDestPath = './src/config/pokemon-data.json';

    delete require.cache[require.resolve(configSrcPath)];
    var config = require(configSrcPath);

    var jsonSpaceIndent = argv.dev ? '    ' : '';
    var configJson = JSON.stringify(config, null, jsonSpaceIndent);

    fs.writeFileSync(configDestPath, configJson);
});

gulp.task('watch', function() {
    gulp.watch([
        './src/**/*',
        './test/**/*',
        './package.json',
        '!./src/config/pokemon-data.json',
    ], ['build']);
});

/*
 * Allows testing without reinstalling the usescript at each change.
 * Generates an empty userscript importing the main userscript file.
 * This way, the main file is never cached by the browser.
 *
 * Requirements :
 * - Write access on /tmp
 * - Google Chrome with Tampermonkey extension
 * - Tampermonkey must have the right to access local files
 * - Ability to run Google Chrome via the command "google-chrome" in the console
 * - Chrome must be running when this task starts (important !)
 */
gulp.task('dev-on-chrome', function() {

    // Loads the userscript header.
    var userscriptHeader = UserscriptHeader.fromPackage(packagePath);
    var userscriptData = userscriptHeader.getData();

    // Adds the main userscript file to the userscript header.
    userscriptData.require = userscriptData.require || [];
    userscriptData.require.unshift('file://' + path.join(webpackConfig.output.path, webpackConfig.output.filename));
    userscriptHeader.setData(userscriptData);

    // Generates an empty userscript in a temporary file.
    var tempDir = 'dev-on-chrome';
    try {
        fs.mkdirSync(path.join(os.tmpdir(), tempDir));
    }
    catch (err) { void 0; }

    var tempUserscriptPath = path.join(os.tmpdir(), tempDir, webpackConfig.output.filename);
    fs.writeFileSync(tempUserscriptPath, userscriptHeader.toString());

    // Loads this userscript in Google Chrome.
    exec('google-chrome file://' + tempUserscriptPath);
});

gulp.task('watch-on-chrome', ['dev-on-chrome', 'watch']);
