var gulp = require('gulp');
var browserify = require('gulp-browserify');

gulp.task('scripts', function() {
    return gulp.src(['lib/client/js/**/*.js'])
        .pipe(browserify())
        .pipe(gulp.dest('static/js'));
});

// Copy all static images
//gulp.task('images', function() {
//    return gulp.src('client/img/**')
//        // Pass in options to the task
//        .pipe(imagemin({optimizationLevel: 5}))
//        .pipe(gulp.dest('build/img'));
//});

// Rerun the task when a file changes
gulp.task('watch', function () {
    gulp.watch('lib/**', ['scripts']);
//    gulp.watch('client/img/**', ['images']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['scripts', 'watch']);
