
/**
 * Module dependencies.
 */

var express = require('express');
var _ = require('underscore');
var http = require('http');
var path = require('path');
var cons = require('consolidate');
var config = require('config');

// routes
var index = require('../routes/index');
var bookSeries = require('../routes/bookSeries');


exports.startServer = function( ) {
    var app = express();

    // all environments
    app.engine('html', cons.hogan);
    app.set('port', process.env.PORT || config.Server.port);
    app.set('views', path.join(__dirname, '..', 'views'));
    app.set('layout', 'layout');
    app.set('view engine', 'html');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, '..', '..', 'public')));
    app.enable('view cache');

    // development only
    if (config.useErrorHandler) {
      app.use(express.errorHandler());
    }

    app.get('/', index.list);
    app.get('/bookSeries/:id', bookSeries.list);
    http.createServer(app).listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
    });
}