//引入gulp
var gulp = require('gulp');
//引入组件
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-clean-css');
var rename = require('gulp-rename');
var browserSync = require('browser-sync').create();
//检查JS脚本
gulp.task('lint', function() {
    gulp.src('src/components/*/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
//编译sass 读取 编译 输出到新文件夹中
gulp.task('sass', function() {
    gulp.src('src/components/*/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('src/components'));
});
//合并压缩文件
gulp.task('concatjs', function() {
    //读取JS文件，合并，输出到新目录，重新命名，压缩，输出
    gulp.src(['src/components/tools/tools.js','src/components/*/*.js'])
        .pipe(concat('codebase.js'))
        .pipe(gulp.dest('src'))
        .pipe(uglify())
        .pipe(rename('codebase.min.js'))
        .pipe(gulp.dest('src'));
});

gulp.task('concatcss', function() {
    //读取CSS文件，合并，输出到新目录，重新命名，压缩，输出
    gulp.src('src/components/*/*.css')
        .pipe(concat('codebase.css'))
        .pipe(gulp.dest('src'))
        .pipe(rename('codebase.min.css'))
        .pipe(cssmin())
        .pipe(gulp.dest('src'));
});
//服务器插件中，监视文件并自动刷新
gulp.task('watch', function() {
    browserSync.init({
        server: {
            baseDir: 'src'
        }
    });
    gulp.watch(['src/components/*/*.js', 'src/components/*/*.scss', 'src/*.html'], function() {
        gulp.run('ready');
        browserSync.reload();
    });
});
gulp.task('ready', ['sass', 'concatjs', 'concatcss']);
gulp.task('server', ['ready', 'watch']);
//默认行为,直接调用服务器
gulp.task('default', function() {
    gulp.run('server');
});
