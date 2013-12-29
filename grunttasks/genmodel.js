'use strict';

module.exports = function(grunt) {

   var bookDB = require('../src/models/bookDB')
    
    grunt.registerMultiTask('genmodel', 'Generate Goodreads Model', function() {
        bookDB.genModel( this.async() );
    });
    
};


