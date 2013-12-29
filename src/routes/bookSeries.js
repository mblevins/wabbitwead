'use strict';

//var _ = require('underscore');
var bookDB = require('../models/bookDB');
var navbar = require('../routes/navbar');

/*
 * GET home page.
 */

exports.list = function(req, res){
    
    var books = bookDB.getBooksByShelfName( req.params.id );
    var thisSeries = bookDB.getSeriesByShelfName( req.params.id );
    
    res.render('layout', {
        thisSeries: thisSeries,
        navbarList: navbar.list(),
        books: books,
        partials: { navbar: "navbar", body: "bookSeries" }
     });
};