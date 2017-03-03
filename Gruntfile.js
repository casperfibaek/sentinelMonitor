module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      options: {
        configFile: 'node_modules/eslint-config-standard/eslintrc.json',
        rulePaths: ['node_modules/eslint-plugin-standard/rules']
      },
      src: ['src/**/*.js', '!leaflet.js']
    },

    babel: {
      options: {
        sourceMap: false,
        presets: ['es2015']
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/public/js',
          src: ['*.js'],
          dest: 'dist/public/js',
          ext: '.js'
        }]
      }
    },

    uglify: {
      options: {
        banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n'
      },
      build: {
        files: {
          'dist/public/js/app.min.js': [
            'dist/public/js/leaflet.js',
            'dist/public/js/editable.js',
            'dist/public/js/path.js',
            'dist/public/js/db.js',
            'dist/public/js/app.js'
          ]
        }
      }
    },

    cssmin: {
      options: {
        mergeIntoShorthands: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          'dist/public/css/app.min.css': [
            'src/public/css/font-awesome.css',
            'src/public/css/spinners.css',
            'src/public/css/leaflet.css',
            'src/public/css/app.css'
          ]
        }
      }
    },

    copy: {
      main: {
        files: [
          {expand: true, cwd: 'src/', src: ['**'], dest: 'dist/'},
          {expand: true, cwd: 'test/', src: ['**'], dest: 'dist/views/'}
        ]
      }
    },

    clean: {
      contents: ['dist'],
      js: ['dist/public/js/*.js', '!dist/public/js/*.min.js'],
      css: ['dist/public/css/*.css', '!dist/public/css/*.min.css']
    }

  })
  grunt.loadNpmTasks('gruntify-eslint')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-cssmin')
  grunt.loadNpmTasks('grunt-contrib-clean')

  grunt.registerTask('default', ['clean:contents', 'eslint', 'babel', 'uglify', 'cssmin', 'copy', 'clean:js', 'clean:css'])
}
