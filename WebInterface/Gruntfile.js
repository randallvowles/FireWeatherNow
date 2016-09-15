module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            folders: ['dist/__*.js']
        },
        import: {
            options: {},
            dist: {
                expand: true,
                cwd: 'src/',
                src: ['__*.js'],
                dest: 'dist/',
                ext: '.js'
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'dist/__*.js'],
            options: {
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        strip_code: {
            options: {
                patterns: [/.*\/\* js.*int.*/g]
            },
            dist: {
                files: [{
                    src: 'dist/__*.js',
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
                }, {
                    src: 'dist/__*.js',
                    dest: 'dist/<%= pkg.name %>-current.js'
                }]
            }
        },
        jsbeautifier: {
            files: ["dist/*.js"],
        },
        uglify: {
            options: {
                banner: '/*\n<%= pkg.name %>-<%= pkg.version %>.js\n(C) 2016 MesoWest/SynopticLabs. All rights reserved.\n*/\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>-current.min.js': 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-import');
    grunt.loadNpmTasks('grunt-strip-code');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-jsbeautifier");

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('default', ['clean', 'import', 'jshint', 'strip_code', 'clean', 'jsbeautifier', 'uglify']);

};
