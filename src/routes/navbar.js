'use strict';

var _ = require('underscore');
var bookDB = require('../models/bookDB');

exports.list = function(req, res){

    var series = bookDB.getSeries();
    var navbarElements = [];
    _.each( series, function(series, context) {
        var navbarElement = {};
        navbarElement["url"] = "/bookSeries/" + series.shelfName;
        navbarElement["name"] =series.seriesName;
        navbarElements.push( navbarElement );
    });
    return( navbarElements );
};