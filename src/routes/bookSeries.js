'use strict';

/// var _ = require('underscore');
var bookDB = require('../models/bookDB');
var navbar = require('../routes/navbar');

/*
 * GET home page.
 */

exports.list = function(req, res){
    
    var books = bookDB.getBooksBySeriesName( req.params.id );
    
    res.render('layout', {
        authors: navbar.list(),
        books: books,
        partials: { navbar: "navbar", body: "bookSeries" }
     });
};