'use strict';

var assert = require("assert");
var appx = require("../src/helpers/server.js");
var http = require('http');


appx.startServer();

describe('bookSeries', function(){
  describe('simple bookSeries fetch', function(){
    it('should return 200', function(done){
        var httpOptions = {
            host: "localhost",
            port: "3000",
            path: "/bookSeries/wabbit-kate-daniels"
        };
        console.log("making request: " + "http://" + httpOptions.host + ":" + httpOptions.port + httpOptions.path );
        var req = http.get(httpOptions, function(resp) {
            resp.on('data', function( chunk ) {
                // we need to consume this or the request stalls
            });
            resp.on('end', function() {
                console.log("Got end: " + resp.statusCode);
                assert( resp.statusCode == 200);
                done();
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            assert( false );
            done();
        });
    })
  })
});
