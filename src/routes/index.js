'use strict';

// var _ = require('underscore');
// var bookDB = require('../models/bookDB');
var navbar = require('../routes/navbar');

/*
 * GET home page.
 */

exports.list = function(req, res){

    res.render('layout', {
        navbarList: navbar.list(),
        partials: { navbar: "navbar", body: "welcome" }
     });
};