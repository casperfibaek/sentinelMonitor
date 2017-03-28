module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      options: {
        configFile: 'node_modules/eslint-config-standard/eslintrc.json',
        rulePaths: ['node_modules/eslint-plugin-standard/rules']
      },
      src: ['src/**/*.js']
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
            'dist/public/js/ext_ga.js',
            'dist/public/js/ext_jquery.js',
            'dist/public/js/ext_scrollbar.js',
            'dist/public/js/ext_leaflet.js',
            'dist/public/js/ext_editable.js',
            'dist/public/js/ext_path.js',
            'dist/public/js/app.js',
            'dist/public/js/database.js',
            'dist/public/js/render_loading.js',
            'dist/public/js/render_login.js',
            'dist/public/js/render_logout.js',
            'dist/public/js/render_signup.js',
            'dist/public/js/render_sites.js',
            'dist/public/js/render_create.js',
            'dist/public/js/render_popups.js',
            'dist/public/js/render_table.js',
            'dist/public/js/init.js'
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
            'src/public/css/app.css',
            'src/public/css/spinners.css',
            'src/public/css/font-awesome.css',
            'src/public/css/scrollbar.css',
            'src/public/css/leaflet.css'
          ]
        }
      }
    },

    copy: {
      main: {
        files: [
          {expand: true, cwd: 'src/', src: ['**'], dest: 'dist/'},
          {expand: true, cwd: 'src/views/deploy', src: ['layout.hbs'], dest: 'dist/views/'}
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

  grunt.registerTask('build', ['clean:contents', 'eslint', 'babel', 'uglify', 'cssmin', 'copy', 'clean:js', 'clean:css'])
}
