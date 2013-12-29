'use strict';

var _ = require('underscore');
var fs = require('fs');
var sax = require("sax");
var http = require('http');
var config = require('config');
var path = require('path');


// goodreads options
var goodreadOptions = {
    host: "www.goodreads.com",
    port: "80",
    user: "18819918",
    appKey: "SD5knqEYmd8A6lNtfjtGg",
};

// where the book model file is
var bookModelFile = path.join( config.Models.dir, "books.json" );

// where the series model file is
var seriesModelFile = path.join( config.Models.dir, "series.json");

// override exceptions
var exceptionsFile = path.join( config.Models.dir, "exceptions.json");

/* 
 * bookDB is persisted in books.json
 * Array of:
 * {
 *   id: book-id
 *   shelf_name: goodreads-shelf-name
 *   title: book-title
 *   image_url: book image
 *   link: link to goodreads
 *   publication_year: year published
 *   description: description with html tags
 *   authors: First author of the book
 * }
 */
var bookDB = [];

/* 
 * seriesDB is persisyed in series.json
 * Array of:
 * {
 *   shelfName: goodreads shelf-name
 *   seriesName: friendly series name
 *   description: series-description
 * }
 */
var seriesDB = [];


function readModel() {
    // assume bookDB and seriesDB are init'ed at same time
    if (bookDB.length === 0) {
        bookDB = JSON.parse( fs.readFileSync( bookModelFile ) );
        seriesDB = JSON.parse( fs.readFileSync( seriesModelFile ) );
    }
}

function writeModel( doneWrapperParam ) {
    // calc exceptions
    var exceptionDB = JSON.parse( fs.readFileSync( exceptionsFile ) );
    _.each( bookDB, function(book, context) {
        var exception = _.findWhere( exceptionDB, { id: book.id } );
        if (exception !== undefined) {
            if (exception.description !== undefined) {
                book.description = exception.description;
            }
            if (exception.publication_year !== undefined) {
                book.publication_year = exception.publication_year;
            }
            if (exception.publication_month !== undefined) {
                book.publication_month = exception.publication_month;
            }
        }
    });
    try {
        console.log("writing " + bookModelFile );
        fs.writeFileSync( bookModelFile, JSON.stringify(bookDB, null, " "));
    }
    catch( err ) {
        console.log("Error writing file: " + err);
    }
}

function DoneWrapper( doneWrapperParam ) {
    
    var doneWrapper = doneWrapperParam;
    var numShelfs = 0;
    var numLists=0;
    
    return {
        startShelf: function() {
            numShelfs++;
        },
        startList: function() {
            numLists++;
        },
        endShelf: function() {
            numShelfs--;
            if (numLists === 0 && numShelfs === 0) {
                writeModel( doneWrapperParam );
                doneWrapper();
            }
        },
        endList: function() {
            numLists--;
            if (numLists === 0 && numShelfs === 0) {
                writeModel();
                doneWrapper( doneWrapperParam );
            }
        },
        error: function(e) {
            doneWrapper(e);
        }
    };
}

function ShelfGetter( shelfNameParam, doneWrapperParam ) {
    
    var curBook = "";
    var curText = "";
    var curPath = [];
    var curError = null;
    var doneWrapper = doneWrapperParam;
    var shelfName = shelfNameParam;

    var parser = sax.parser( false );

    parser = sax.parser( false );
    
    parser.onerror = function( e ) {
        console.log("Parse error: " + e );
        curError = e;
    };
    
    parser.ontext = function( t ) {
        curText = curText + t;
    };
    
    parser.onopentag = function( t ) {
        curPath.push( t.name );
        var curPathStr = "/" + curPath.join("/");
        if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK") {
            curBook = {};
            curBook["shelf_name"] = shelfName;
        }
        curText = "";
    };
    
    parser.onclosetag = function( t ) {
        var curPathStr = "/" + curPath.join("/");
        if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK") {
            console.log("pushing book " + curBook.title);
            bookDB.push( curBook );
        }
        else if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK/ID") {
            curBook["id"] = curText;
        }
        else if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK/TITLE") {
            curBook["title"] = curText;
        }
        else if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK/IMAGE_URL") {
            curBook["image_url"] = curText;
        }
        else if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK/LINK") {
            curBook["link"] = curText;
        }
        else if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK/DESCRIPTION") {
            curBook["description"] = curText;
        }
        else if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK/PUBLICATION_YEAR") {
            curBook["publication_year"] = curText;
        }
        else if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK/PUBLICATION_MONTH") {
            curBook["publication_month"] = curText;
        }
        else if (curPathStr === "/GOODREADSRESPONSE/BOOKS/BOOK/AUTHORS/AUTHOR/NAME") {
            // we just take the first
            if (curBook["author"] === undefined) {
                curBook["author"] = curText;     
            }
        }
        if (curPath.pop() !== t ) {
            console.log("Oops, tags don't match, bailing");
            doneWrapper.error( new Error("tags mismatch"));
        }
    };
    
    parser.onend = function() {
        doneWrapper.endShelf( );
    };
    
    var startFunc = function() {
        // make the http request
        var xmlStr="";
        
        var httpOptions = {};
        
        httpOptions["host"] = goodreadOptions.host;
        httpOptions["port"] = goodreadOptions.port;
        httpOptions["path"] =
            "/review/list?format.xml" +
            "&id=" + goodreadOptions.user +
            "&key=" + goodreadOptions.appKey +
            "&shelf=" + shelfName +
            "&sort=position";
            
        console.log("making request: " + "http://" + httpOptions.host + ":" + httpOptions.port + httpOptions.path );
        doneWrapper.startShelf();
        var req = http.get(httpOptions, function(resp) {
            resp.on('data', function( chunk ) {
                // good place to call parser.write, but it doesn't seem happy with chunks
                xmlStr = xmlStr + chunk;
            });
            resp.on('end', function() {
                console.log("Got end for: " + "http://" + httpOptions.host + ":" + httpOptions.port + httpOptions.path + ", respcode=" + resp.statusCode);
                if (resp.statusCode !== 200) {
                    console.log( "Status isn't right, bailing out");
                    doneWrapper.error( new Error("Bad status"));
                }
                else {
                    console.log("Starting parse");
                    // some debugging
                    try {
                        var shelfXMLFile = path.join( config.Models.dir, "shelf-" + shelfName + ".xml" );
                        console.log("writing " + shelfXMLFile );
                        fs.writeFileSync( shelfXMLFile, xmlStr );
                    }
                    catch( err ) {
                        console.log("Error writing file: " + err);
                    }
                    
                    parser.write( xmlStr );
                    parser.close();
                }
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            doneWrapper(e);
        });
    };
    return {
        start: startFunc
    };
}
    
    
function ShelfListGetter( doneWrapperParam ) {

    var curID = "";
    var curName = "";
    var curText = "";
    var curPath = [];
    var curError = null;
    var doneWrapper = doneWrapperParam;
    var shelfGetters = [];

    var parser = sax.parser( false );

    parser = sax.parser( false );

    parser.onerror = function( e ) {
        console.log("Parse error: " + e );
        curError = e;
    };

    parser.ontext = function( t ) {
        curText = curText + t;
    };

    parser.onopentag = function( t ) {
        curPath.push( t.name );
        var curPathStr = "/" + curPath.join("/");
        if (curPathStr === "/GOODREADSRESPONSE/SHELVES/USER_SHELF") {
            curID = "";
            curName = "";
        }
        curText = "";
    };

    parser.onclosetag = function( t ) {
        var curPathStr = "/" + curPath.join("/");
        if (curPathStr === "/GOODREADSRESPONSE/SHELVES/USER_SHELF") {
            console.log("checking shelf " + curName );
            if (curName.substring( 0, 6 ) === "wabbit") {
                console.log("getting a new shelf");
                var shelfGetter = new ShelfGetter( curName, doneWrapper );
                shelfGetters.push(shelfGetter);
                shelfGetter.start();
            }
        }
        else if (curPathStr === "/GOODREADSRESPONSE/SHELVES/USER_SHELF/ID") {
            curID = curText;
        }
        else if (curPathStr === "/GOODREADSRESPONSE/SHELVES/USER_SHELF/NAME") {
            curName = curText;
        }
        if (curPath.pop() !== t ) {
            console.log("Oops, tags don't match, bailing");
            doneWrapper.error( new Error("tags mismatch"));
        }
    };

    parser.onend = function() {
        doneWrapper.endList( );
    };

    var startFunc = function() {
        // make the http request
        var xmlStr="";
    
        var httpOptions = {};
    
        httpOptions["host"] = goodreadOptions.host;
        httpOptions["port"] = goodreadOptions.port;
        httpOptions["path"] =
            "/shelf/list.xml" +
            "?user_id=" + goodreadOptions.user +
            "&key=" + goodreadOptions.appKey;
        
        console.log("making request: " + "http://" + httpOptions.host + ":" + httpOptions.port + httpOptions.path );
        doneWrapper.startList();
        var req = http.get(httpOptions, function(resp) {
            resp.on('data', function( chunk ) {
                // good place to call parser.write, but it doesn't seem happy with chunks
                xmlStr = xmlStr + chunk;
            });
            resp.on('end', function() {
                console.log("Got end for: " + "http://" + httpOptions.host + ":" + httpOptions.port + httpOptions.path + ", respcode=" + resp.statusCode);
                if (resp.statusCode !== 200) {
                    console.log( "Status isn't right, bailing out");
                    doneWrapper.error( new Error("Bad status"));
                }
                else {
                    console.log("Starting parse");
                    parser.write( xmlStr );
                    parser.close();
                }
            });
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            doneWrapper(e);
        });
    };
    return {
        start: startFunc
    };
}

exports.getSeries = function() {
    readModel();
    return seriesDB;
};

exports.getSeriesByShelfName = function( shelfName ) {
    readModel();

    var series = _.find( seriesDB, function( series, context) {
        return(series.shelfName === shelfName );
    });
    return series;
};

exports.getBooksByShelfName = function( shelfName ) {
    readModel();
    var books = _.filter( bookDB, function( book, context) {
        return(book.shelf_name === shelfName );
    });
    return books;
};

exports.getAllBooks = function() {
    readModel();
    return bookDB;
};


exports.forceReRead = function() {
    bookDB.length = 0;
};

/*
 * "doneCallback" is like the "done()" function from grunt.async()
 */
exports.genModel = function( doneCallback ) {
    
    console.log("genmodel" );
    var doneWrapper = new DoneWrapper( doneCallback );
    var shelfListGetter = new ShelfListGetter( doneWrapper );
    shelfListGetter.start();
};
