'use strict';

var assert = require("assert");
var bookDB = require('../src/models/bookDB')

describe('modelgeb', function(){
    describe('simple create of model', function( ){
        it('should not fail with error', function(done){
            // this will call done with err if we have one
            bookDB.genModel( done );
        });
    });
});

