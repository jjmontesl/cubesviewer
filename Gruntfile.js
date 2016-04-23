module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
              'cubesviewer/cubesviewer.templates.js',
              'cubesviewer/cubes.js',
              'cubesviewer/cubesviewer.js',
              'cubesviewer/cubesviewer.cache.js',
              'cubesviewer/cubesviewer.views.js',
              'cubesviewer/cubesviewer.views.cube.js',
              /*
              'cubesviewer/cubesviewer.views.cube.explore.js',
              'cubesviewer/cubesviewer.views.cube.datefilter.js',
              'cubesviewer/cubesviewer.views.cube.rangefilter.js',
              'cubesviewer/cubesviewer.views.cube.series.js',
              'cubesviewer/cubesviewer.views.cube.chart.js',
              'cubesviewer/cubesviewer.views.cube.facts.js',
              'cubesviewer/cubesviewer.views.cube.dimensionfilter.js',
              'cubesviewer/cubesviewer.views.cube.columns.js',
              'cubesviewer/cubesviewer.views.cube.export.js',
              'cubesviewer/cubesviewer.views.undo.js',
              */

              'cubesviewer/gui/gui.js',
              'cubesviewer/gui/serialize.js',
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    less: {
    	options: {
    	},
    	dist: {
	    	files: {
	    		'dist/cubesviewer.css': 'cubesviewer/cubesviewer.less'
	    	}
    	}
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    copy: {
      	dist: {
    		files: [
	        ]
    	}
    },
    qunit: {
      files: ['test/**/*.html']
    },
    bower: {
    	install: {
    		options: {
    			targetDir: 'html/lib/',
    			layout: 'byComponent',
    			verbose: true
		    }
	    }
    },
    /*
    wiredep: {
	  dist: {
          src: [
        	  'html/*.html'
          ],
          options: {
        	 ignorePath: '../bower_components/',
        	 fileTypes: {
        		 html: {
        			 replace: {
        				 js: '<script src="../lib/{{filePath}}"></script>',
        				 css: '<link rel="stylesheet" href="../lib/{{filePath}}" />'
        			 }
        		 }
        	 }
          }
      }
	},
	*/
    jshint: {
      files: ['Gruntfile.js', 'bower,json', 'cubesviewer/**/*.js', 'cubesviewer/**/*.less', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>', 'bower.json', 'cubesviewer/**/*.*'],
      tasks: ['default']
    },
    filesToJavascript: {
    	default_options: {
    		options: {
    			inputFilesFolder: 'cubesviewer/html/',
    			inputFileExtension: 'html',
    			outputBaseFile: 'cubesviewer/cubesviewer.templates.js.tmpl',
    			outputBaseFileVariable: 'cvtemplates',
    			outputFile: 'cubesviewer/cubesviewer.templates.js'
    		}
    	}
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-bower-task')
  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-files-to-javascript-variables');

  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['less', 'filesToJavascript', 'concat', 'uglify']); // 'bower',

};

