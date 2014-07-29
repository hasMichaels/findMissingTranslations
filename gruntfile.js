module.exports = function(grunt) {

  // Load all grunt tasks matching the `grunt-*` pattern

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          ui: 'tdd',
          reporter: 'nyan',
        },
        src: ['test/**/*.js']
      }
    }
  });

  grunt.registerTask('default', ['mochaTest']);

};