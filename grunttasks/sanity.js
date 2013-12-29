'use strict';

var _ = require('underscore');

module.exports = function(grunt) {

   var bookDB = require('../src/models/bookDB')
    
    grunt.registerMultiTask('sanity', 'Sanity Checks', function() {
        bookDB.forceReRead();
        var books = bookDB.getAllBooks();
        var series = bookDB.getSeries();
        var exceptBuf = "";

        console.log("Starting scan for " + books.length + " books");
        _.each( books, function(book, context) {
            var tempExceptBuf = "{\n";
            tempExceptBuf += "  \"id\": \"" + book.id + "\",\n";
            tempExceptBuf += "  \"title\": \"" + book.title + "\",\n";
            
            // this is a little silly, but we used to require publication_year, which was missing a lot
            var needsException = false;
            if (book.description === "") {
                console.log(book.title + "(" + book.id + ")" + " is missing a description");
                tempExceptBuf += "  \"description\": \"\",\n"
                needsException = true;
            }
            if (bookDB.getSeriesByShelfName( book.shelf_name ) === undefined) {
                console.log(book.title + "(" + book.id + ")" + " is in undefined shelf " + "\"" + book.shelf_name + "\"")
            }
            if (needsException)  {
                exceptBuf += tempExceptBuf + "\n},\n";
            }
        });
        if (exceptBuf !== "") {
            console.log(">>> Copy and Paste:\n" + exceptBuf + "\n<<<");
        }
    });
    
    
};


